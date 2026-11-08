import { test, expect } from '@playwright/test'
import { entryMeta, entryOfferings, entryRows } from '../entryFixtures.js'
import { readFixture } from '../../../../test/readFixtures.js'

// All writes here are explicitly intercepted fixtures, never database requests.
async function fixture(page, { partial = false, delayed = false } = {}) {
  let rows = structuredClone(entryRows), release
  const writes = [], reads = []
  await page.addInitScript(() => localStorage.setItem('token', 'entry-fixture'))
  await page.route('**/api/**', async (route) => {
    const request = route.request(), path = new URL(request.url()).pathname
    if (request.method() !== 'GET') {
      writes.push({ path, body: request.postDataJSON() })
      if (request.method() === 'PUT') {
        if (delayed) await new Promise((resolve) => { release = resolve })
        if (partial && path.endsWith('/2')) return route.fulfill({ status: 403, json: { message: 'Đây không phải lớp học phần của bạn' } })
        const id = Number(path.split('/').at(-1)), body = request.postDataJSON()
        const result = { id: 100 + id, total: 6.27, letter: 'C', result: 'PASSED', created: true }
        rows = rows.map((row) => row.enrollment_id === id ? { ...row, ...body, grade_id: result.id, total_score: result.total, letter_grade: result.letter, result: result.result } : row)
        return route.fulfill({ json: result })
      }
      if (request.method() === 'DELETE') {
        rows = rows.map((row) => row.grade_id === Number(path.split('/').at(-1)) ? { ...row, grade_id: null, attendance_score: null, midterm_score: null, final_score: null, total_score: null, letter_grade: null, result: null } : row)
      }
      if (path.endsWith('/enroll')) rows.push({ ...entryRows[0], enrollment_id: 4, student_code: 'SVNEW', full_name: 'Sinh viên thêm mới' })
      return route.fulfill({ json: { message: 'Fixture success' } })
    }
    reads.push(path)
    let json
    if (path === '/api/auth/me') json = { id: 1, username: 'fixture', role: 'ADMIN', full_name: 'Fixture ADMIN' }
    else if (path === '/api/meta') json = entryMeta
    else if (path === '/api/offerings') json = entryOfferings
    else if (path === '/api/offerings/11/students') json = rows
    else if (path === '/api/offerings/12/students') json = []
    else json = readFixture(request.url()) ?? []
    return route.fulfill({ json })
  })
  return { writes, reads, release: () => release?.() }
}
const final = (page, id = 1) => page.getByLabel(`Điểm cuối kỳ SV00${id}`)
const row = (page, id = 1) => page.locator(`[data-enrollment="${id}"]`)
const leave = (page) => page.getByRole('dialog', { name: 'Rời trang nhập điểm?' })

test('hash navigation: menu, Back/Forward, semester/offering and logout preserve cancelled drafts', async ({ page }) => {
  await fixture(page)
  await page.goto('/#/password')
  await page.getByRole('link', { name: 'Nhập điểm', exact: true }).click()
  await final(page).fill('8')
  await page.getByRole('link', { name: 'Đổi mật khẩu' }).click()
  await expect(leave(page)).toBeVisible()
  await expect(leave(page).getByRole('button', { name: 'Hủy' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(final(page)).toHaveValue('8')
  await page.goBack()
  await expect(leave(page)).toBeVisible()
  await leave(page).getByRole('button', { name: 'Hủy' }).click()
  await expect(page).toHaveURL(/#\/entry$/)
  await expect(final(page)).toHaveValue('8')
  await page.getByLabel('Lớp học phần', { exact: true }).selectOption('12')
  await leave(page).getByRole('button', { name: 'Hủy' }).click()
  await expect(page.getByLabel('Lớp học phần', { exact: true })).toHaveValue('11')
  await page.getByLabel('Học kỳ', { exact: true }).selectOption('2')
  await leave(page).getByRole('button', { name: 'Hủy' }).click()
  await expect(page.getByLabel('Học kỳ', { exact: true })).toHaveValue('1')
  await page.getByRole('button', { name: 'Đăng xuất' }).click()
  await leave(page).getByRole('button', { name: 'Hủy' }).click()
  await expect(final(page)).toHaveValue('8')
  await page.goBack()
  await leave(page).getByRole('button', { name: 'Bỏ thay đổi và tiếp tục' }).click()
  await expect(page).toHaveURL(/#\/password$/)
  await page.goForward()
  await expect(page).toHaveURL(/#\/entry$/)
  await expect(final(page)).toHaveValue('')
  // Forward navigation is also blocked, not just links and Back.
  await page.getByRole('link', { name: 'Đổi mật khẩu' }).click()
  await page.goBack()
  await final(page).fill('9')
  await page.goForward()
  await expect(leave(page)).toBeVisible()
  await leave(page).getByRole('button', { name: 'Hủy' }).click()
  await expect(final(page)).toHaveValue('9')
  await page.getByLabel('Lớp học phần', { exact: true }).selectOption('12')
  await leave(page).getByRole('button', { name: 'Bỏ thay đổi và tiếp tục' }).click()
  await expect(page.getByText('Lớp chưa có sinh viên.')).toBeVisible()
})

test('real Chrome beforeunload dialog cancels refresh; discard reload clears draft', async ({ page }) => {
  await fixture(page)
  await page.goto('/#/entry')
  await final(page).fill('0')
  const cancelled = page.waitForEvent('dialog').then(async (dialog) => { expect(dialog.type()).toBe('beforeunload'); await dialog.dismiss() })
  // A cancelled reload has no navigation completion to await.
  await page.evaluate(() => { setTimeout(() => location.reload(), 0) })
  await cancelled
  await expect(final(page)).toHaveValue('0')
  const accepted = page.waitForEvent('dialog').then(async (dialog) => { expect(dialog.type()).toBe('beforeunload'); await dialog.accept() })
  await page.reload()
  await accepted
  await expect(final(page)).toHaveValue('')
})

test('partial save, new grade ID history/delete, enroll and refresh keep other draft', async ({ page }) => {
  const api = await fixture(page, { partial: true })
  await page.goto('/#/entry')
  await final(page).fill('0')
  await final(page, 2).fill('10')
  await page.getByRole('button', { name: 'Lưu tất cả', exact: true }).click()
  await expect(page.getByText('Lưu tất cả: 1 thành công, 1 thất bại.')).toBeVisible()
  expect(api.writes.map((write) => write.path)).toEqual(['/api/grades/enrollment/1', '/api/grades/enrollment/2'])
  await expect(row(page).getByText('6.27')).toBeVisible()
  await expect(final(page, 2)).toHaveValue('10')
  await page.getByRole('button', { name: 'Làm mới dữ liệu' }).click()
  await expect(final(page, 2)).toHaveValue('10')
  await row(page).getByRole('button', { name: 'Lịch sử' }).click()
  await expect(page.getByRole('dialog', { name: 'Lịch sử sửa điểm' })).toBeVisible()
  await expect.poll(() => api.reads.includes('/api/grades/101/history')).toBe(true)
  await page.getByRole('button', { name: 'Đóng', exact: true }).click()
  await row(page).getByRole('button', { name: 'Xóa điểm' }).click()
  const confirmation = page.getByRole('dialog', { name: 'Xóa điểm' })
  await expect(confirmation).toContainText('SV001')
  await confirmation.getByRole('button', { name: 'Xóa điểm', exact: true }).click()
  await expect(row(page).getByRole('button', { name: 'Xóa điểm' })).toHaveCount(0)
  expect(api.writes.at(-1).path).toBe('/api/grades/101')
  await expect(final(page, 2)).toHaveValue('10')
  await page.getByLabel('Mã sinh viên thêm vào lớp').fill('SVNEW')
  await page.getByRole('button', { name: 'Thêm sinh viên vào lớp' }).click()
  await expect(page.getByText('Sinh viên thêm mới', { exact: true })).toBeVisible()
  await expect(final(page, 2)).toHaveValue('10')
})

test('pending save locks row, repeated clicks and navigation until completion', async ({ page }) => {
  const api = await fixture(page, { delayed: true })
  await page.goto('/#/entry')
  await final(page).fill('5')
  await row(page).getByRole('button', { name: 'Lưu', exact: true }).dblclick()
  await expect(final(page)).toBeDisabled()
  await expect.poll(() => api.writes.length).toBe(1)
  await final(page, 2).fill('7')
  await page.getByRole('link', { name: 'Đổi mật khẩu' }).click()
  await expect(leave(page)).toContainText('Đang gửi dữ liệu')
  await expect(leave(page).getByRole('button', { name: 'Đang xử lý...' })).toBeDisabled()
  api.release()
  await expect(leave(page).getByRole('button', { name: 'Hủy' })).toBeEnabled()
  await leave(page).getByRole('button', { name: 'Hủy' }).click()
  await expect(final(page, 2)).toHaveValue('7')
  await expect(row(page).getByText('Đã lưu', { exact: true })).toBeVisible()
})

for (const width of [360, 1280]) {
  test(`entry table remains usable at ${width}px`, async ({ page }, testInfo) => {
    await fixture(page)
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/#/entry')
    await final(page).fill('10.01')
    await row(page).getByRole('button', { name: 'Lưu', exact: true }).click()
    await expect(page.getByText('Điểm cuối kỳ phải là số từ 0 đến 10')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const table = page.getByRole('region', { name: 'Nhập điểm sinh viên' })
    await table.evaluate((element) => { element.scrollLeft = 0 })
    await page.screenshot({ path: testInfo.outputPath(`entry-${width}.png`), fullPage: true })
  })
}
