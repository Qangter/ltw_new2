import { test, expect } from '@playwright/test'
import { emptyOverviewFixture, statsFixtures } from '../statsFixtures.js'

// Synthetic network fixtures only. Every API request is intercepted; no DB is used.
async function mockStats(page, role = 'ADMIN') {
  const state = { responses: { ...statsFixtures }, errors: {}, requests: [], unexpected: [] }
  await page.addInitScript(() => localStorage.setItem('token', 'stats-browser-fixture'))
  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    state.requests.push(path)
    if (request.method() !== 'GET') {
      state.unexpected.push(`${request.method()} ${path}`)
      return route.abort()
    }
    if (path === '/api/auth/me') return route.fulfill({ json: { id: 1, username: 'stats-fixture', full_name: `Fixture ${role}`, role } })
    const section = path.replace('/api/stats/', '')
    if (!Object.hasOwn(state.responses, section)) {
      state.unexpected.push(path)
      return route.abort()
    }
    if (state.errors[section]) return route.fulfill({ status: state.errors[section], json: { message: `Fixture: lỗi ${section}` } })
    return route.fulfill({ json: state.responses[section] })
  })
  return state
}

for (const role of ['ADMIN', 'TEACHER']) {
  test(`${role}: charts, table, shared cache and responsive layout at 360/768/1280px`, async ({ page }, testInfo) => {
    const state = await mockStats(page, role)
    const pageErrors = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    await page.goto('/#/dashboard')
    await expect(page.getByRole('heading', { name: 'Tổng quan', exact: true })).toBeVisible()
    await expect(page.locator('.stat')).toHaveCount(8)
    await expect(page.locator('.pie-chart')).toHaveCount(2)
    await expect(page.locator('.pie-legend-item')).toHaveCount(4)
    await expect(page.getByText('81.23%', { exact: true })).toBeVisible()
    expect(await page.locator('.pie-chart').first().evaluate((element) => getComputedStyle(element).backgroundImage)).toContain('conic-gradient')
    const initialRequests = [...state.requests]

    for (const width of [360, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await expect(page.getByRole('region', { name: 'Sinh viên theo khoa' }).getByText('Khoa Công nghệ thông tin')).toBeVisible()
      // Bring below-the-fold cards into view before capturing a tall mobile page.
      await page.getByText('Điểm trung bình', { exact: true }).scrollIntoViewIfNeeded()
      await expect(page.getByText('7.37', { exact: true })).toBeVisible()
      if (role === 'ADMIN' && width !== 768) await page.screenshot({ path: testInfo.outputPath(`dashboard-${width}.png`), fullPage: true, animations: 'disabled' })
    }
    await page.getByRole('navigation').getByRole('link', { name: 'Thống kê đạt/rớt', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Thống kê đạt/rớt', exact: true })).toBeVisible()
    await expect(page.locator('.stat')).toHaveCount(4)
    const table = page.getByRole('table', { name: 'Thống kê theo môn học' })
    await expect(table.locator('tbody tr')).toHaveCount(2)
    await expect(table.getByRole('columnheader')).toHaveCount(6)
    await expect(table.getByText('83.45%', { exact: true })).toBeVisible()
    const distribution = page.getByRole('region', { name: 'Phân bố điểm chữ' })
    await expect(distribution.locator('.bar-row')).toHaveCount(2)
    const widths = await distribution.locator('.bar i').evaluateAll((elements) => elements.map((element) => Number.parseFloat(element.style.width)))
    expect(widths[0]).toBe(100)
    expect(widths[1]).toBeCloseTo(33.33, 2)
    for (const width of [360, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await expect(table.getByText('Lập trình Web', { exact: true })).toBeVisible()
      if (role === 'ADMIN' && width !== 768) await page.screenshot({ path: testInfo.outputPath(`statistics-${width}.png`), fullPage: true, animations: 'disabled' })
    }
    // Fresh shared sections must be reused when moving between the two pages.
    for (const section of ['overview', 'by-semester', 'distribution']) {
      // Development StrictMode may cancel and restart the first request.
      expect(state.requests.filter((path) => path === `/api/stats/${section}`)).toHaveLength(initialRequests.filter((path) => path === `/api/stats/${section}`).length)
    }
    await page.reload()
    await expect(table.getByText('WEB101', { exact: true })).toBeVisible()
    await page.goBack()
    await expect(page.getByRole('heading', { name: 'Tổng quan', exact: true })).toBeVisible()
    expect(state.unexpected).toEqual([])
    expect(pageErrors).toEqual([])
  })
}

test('empty and zero-count responses show explicit feedback on both pages', async ({ page }) => {
  const state = await mockStats(page)
  state.responses = {
    overview: emptyOverviewFixture, 'by-semester': [], 'by-subject': [],
    distribution: [{ letter_grade: 'A+', total: '0' }],
    'by-department': [{ department_name: 'Khoa trống', students: '0' }],
  }
  await page.goto('/#/dashboard')
  await expect(page.locator('.stat')).toHaveCount(8)
  await expect(page.getByText('Chưa có dữ liệu biểu đồ.', { exact: true })).toHaveCount(2)
  await expect(page.getByText('Chưa có dữ liệu học kỳ.', { exact: true })).toBeVisible()
  await expect(page.getByText('—', { exact: true })).toBeVisible()
  await page.getByRole('navigation').getByRole('link', { name: 'Thống kê đạt/rớt', exact: true }).click()
  await expect(page.getByText('Chưa có dữ liệu môn học.', { exact: true })).toBeVisible()
  await expect(page.getByText('Chưa có dữ liệu biểu đồ.', { exact: true })).toBeVisible()
  await expect(page.locator('.stat')).toHaveCount(4)
  await expect(page.getByRole('table')).toHaveCount(0)
  expect(state.unexpected).toEqual([])
})

test('a section 403 preserves the session and retries only that section', async ({ page }) => {
  const state = await mockStats(page, 'TEACHER')
  state.errors['by-subject'] = 403
  await page.goto('/#/stats')
  await expect(page.getByRole('alert')).toContainText('Fixture: lỗi by-subject')
  await expect(page.locator('.stat')).toHaveCount(4)
  await expect(page.getByText('HK1-2026', { exact: true })).toBeVisible()
  const subjectRequests = state.requests.filter((path) => path.endsWith('/by-subject')).length
  const overviewRequests = state.requests.filter((path) => path.endsWith('/overview')).length
  delete state.errors['by-subject']
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(page.getByRole('table').getByText('WEB101')).toBeVisible()
  expect(state.requests.filter((path) => path.endsWith('/by-subject'))).toHaveLength(subjectRequests + 1)
  expect(state.requests.filter((path) => path.endsWith('/overview'))).toHaveLength(overviewRequests)
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBe('stats-browser-fixture')
  expect(state.unexpected).toEqual([])
})

test('a stats 401 retires the session and removes protected charts', async ({ page }) => {
  const state = await mockStats(page)
  await page.goto('/#/dashboard')
  await expect(page.locator('.stat')).toHaveCount(8)
  state.errors['by-subject'] = 401
  await page.getByRole('navigation').getByRole('link', { name: 'Thống kê đạt/rớt', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('hết hạn')
  await expect(page.locator('.stat')).toHaveCount(0)
  await expect(page.getByRole('table')).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull()
  expect(state.unexpected).toEqual([])
})

test('STUDENT cannot open either staff page or request statistics', async ({ page }) => {
  const state = await mockStats(page, 'STUDENT')
  for (const path of ['dashboard', 'stats']) {
    await page.goto(`/#/${path}`)
    await expect(page.getByRole('heading', { name: 'Không có quyền truy cập' })).toBeVisible()
    await expect(page.locator('.stat')).toHaveCount(0)
  }
  expect(state.requests.every((path) => path === '/api/auth/me')).toBe(true)
  expect(state.unexpected).toEqual([])
})
