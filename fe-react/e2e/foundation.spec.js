import { test, expect } from '@playwright/test'
import { mockReadApi } from './read-fixtures.js'

// UI regression tests use explicit mocked authentication, not backend integration.
test.beforeEach(async ({ page }) => {
  await mockReadApi(page)
  await page.addInitScript(() => localStorage.setItem('token', 'foundation-fixture'))
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { id: 1, username: 'fixture-admin', full_name: 'UI test ADMIN', role: 'ADMIN' } }))
})

test('hash deep-link, refresh, logo, navigation and untouched API data', async ({ page }) => {
  const apiRequests = []
  const errors = []
  page.on('request', (request) => { if (new URL(request.url()).pathname.startsWith('/api')) apiRequests.push(request.url()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/#/student/42')
  await expect(page.getByRole('heading', { name: 'Bảng điểm sinh viên' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Tra cứu sinh viên' })).toHaveAttribute('aria-current', 'page')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Bảng điểm sinh viên' })).toBeVisible()
  await expect.poll(() => page.locator('.brand-logo').evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true)
  await page.getByRole('link', { name: 'Nhập điểm', exact: true }).click()
  await expect(page).toHaveURL(/#\/entry$/)
  await expect(page.getByText('Chức năng chưa được triển khai.', { exact: true })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Bảng điểm sinh viên' })).toBeVisible()
  expect(apiRequests.length).toBeGreaterThan(0)
  expect(apiRequests.every((url) => ['/api/auth/me', '/api/meta', '/api/students/42/transcript'].includes(new URL(url).pathname))).toBe(true)
  expect(errors).toEqual([])
})

test('native modal traps focus, Escape closes and focus returns to trigger', async ({ page }) => {
  await page.goto('/#/__components')
  const trigger = page.getByRole('button', { name: 'Mở modal', exact: true })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Kiểm tra bàn phím' })
  await expect(dialog).toBeVisible()
  await expect(page.getByLabel('Nội dung kiểm tra')).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('button', { name: 'Đóng hộp thoại' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('button', { name: 'Đóng modal', exact: true })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: 'Đóng hộp thoại' })).toBeFocused()
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
})

test('confirmation starts on cancel and toast can be dismissed', async ({ page }) => {
  await page.goto('/#/__components')
  const trigger = page.getByRole('button', { name: 'Mở xác nhận' })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Kiểm tra xác nhận' })
  await expect(dialog.getByRole('button', { name: 'Hủy' })).toBeFocused()
  await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await expect(page.getByRole('status').filter({ hasText: 'Đã xác nhận kiểm tra giao diện.' })).toBeVisible()
  await page.getByRole('button', { name: 'Đóng thông báo' }).click()
  await expect(page.getByText('Đã xác nhận kiểm tra giao diện.')).not.toBeVisible()
})

for (const width of [360, 768, 1280]) {
  test(`sidebar, table and modal fit a ${width}px viewport`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/#/__components')
    await expect(page.getByRole('heading', { name: 'Kiểm tra component' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const table = page.getByRole('region', { name: 'Bảng danh mục component' })
    const tableBounds = await table.boundingBox()
    expect(tableBounds.x + tableBounds.width).toBeLessThanOrEqual(width)
    if (width === 360) {
      expect(await table.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true)
      await table.evaluate((element) => { element.scrollLeft = element.scrollWidth })
      expect(await table.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)
    }
    const menu = page.getByRole('navigation', { name: 'Các chức năng' })
    await menu.getByRole('link', { name: 'Đổi mật khẩu' }).scrollIntoViewIfNeeded()
    await expect(menu.getByRole('link', { name: 'Đổi mật khẩu' })).toBeVisible()
    await menu.evaluate((element) => { element.scrollLeft = 0 })
    await table.evaluate((element) => { element.scrollLeft = 0 })
    await page.screenshot({ path: testInfo.outputPath(`layout-${width}.png`), fullPage: true })
    await page.getByRole('button', { name: 'Mở modal', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Kiểm tra bàn phím' })
    const bounds = await dialog.boundingBox()
    expect(bounds.x).toBeGreaterThanOrEqual(0)
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
    await page.keyboard.press('Escape')
  })
}
