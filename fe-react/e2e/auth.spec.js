import { test, expect } from '@playwright/test'
import { mockReadApi } from './read-fixtures.js'

// Deterministic UI fixtures. These tests never write to a database.
test('login, role guard, refresh, password form and logout with mocked API', async ({ page }, testInfo) => {
  await mockReadApi(page)
  let passwordRequests = 0
  await page.route('**/api/auth/login', (route) => route.fulfill({ json: { token: 'fixture-token' } }))
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { id: 3, username: 'fixture-student', full_name: 'Sinh viên kiểm thử', role: 'STUDENT' } }))
  await page.route('**/api/auth/change-password', async (route) => {
    passwordRequests++
    expect(route.request().postDataJSON()).toEqual({ old_password: 'fixture-old', new_password: 'fixture-new' })
    await route.fulfill({ json: { message: 'Đổi mật khẩu thành công' } })
  })
  await page.goto('/#/users')
  await page.getByLabel('Tên đăng nhập').fill('fixture-student')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('fixture-old')
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page).toHaveURL(/#\/my$/)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Bảng điểm của tôi' })).toBeVisible()
  await page.goto('/#/users')
  await expect(page.getByRole('heading', { name: 'Không có quyền truy cập' })).toBeVisible()
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Tài khoản', exact: true })).toHaveCount(0)
  await page.getByRole('link', { name: 'Đổi mật khẩu' }).click()
  await page.screenshot({ path: testInfo.outputPath('password-desktop.png'), fullPage: true, animations: 'disabled' })
  await page.getByLabel('Mật khẩu hiện tại').fill('fixture-old')
  await page.getByLabel('Mật khẩu mới', { exact: true }).fill('fixture-new')
  await page.getByLabel('Xác nhận mật khẩu mới').fill('fixture-new')
  await page.getByRole('button', { name: 'Lưu mật khẩu' }).click()
  await expect(page.getByText('Đổi mật khẩu thành công')).toBeVisible()
  await expect(page.getByLabel('Mật khẩu hiện tại')).toHaveValue('')
  expect(passwordRequests).toBe(1)
  await page.getByRole('button', { name: 'Đăng xuất' }).click()
  await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible()
  expect(await page.evaluate(() => [localStorage.getItem('token'), localStorage.getItem('user')])).toEqual([null, null])
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible()
})

test('expired token, corrupt storage and mobile login layout (mocked API)', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.addInitScript(() => { localStorage.setItem('token', 'expired'); localStorage.setItem('user', '{broken ADMIN') })
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 401, json: { message: 'Hết hạn' } }))
  await page.goto('/#/dashboard')
  await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('hết hạn')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(page.getByLabel('Tên đăng nhập')).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('login-mobile.png'), fullPage: true, animations: 'disabled' })
})

test('logout in one tab retires the other tab session (mocked API)', async ({ page, context }) => {
  await mockReadApi(context)
  await context.route('**/api/auth/me', (route) => route.fulfill({ json: { id: 1, username: 'fixture', role: 'ADMIN' } }))
  await page.goto('/#/login')
  await page.evaluate(() => localStorage.setItem('token', 'fixture'))
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Tổng quan' })).toBeVisible()
  const second = await context.newPage()
  await second.goto('/#/password')
  await expect(second.getByLabel('Mật khẩu hiện tại')).toBeVisible()
  await page.getByRole('button', { name: 'Đăng xuất' }).click()
  await expect(second.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible()
  await expect(second.getByLabel('Mật khẩu hiện tại')).toHaveCount(0)
})

// Opt-in REAL backend smoke. Uses existing documented demo credentials, read-only
// login + /me + forbidden GET. Never changes passwords or writes application data.
test.describe('live backend (opt-in)', () => {
  test.skip(process.env.LIVE_AUTH !== '1', 'Set LIVE_AUTH=1 with development backend available')
  for (const [username, password, role, home] of [
    ['admin', 'admin123', 'ADMIN', 'Tổng quan'],
    ['teacher01', 'teacher123', 'TEACHER', 'Tổng quan'],
    ['student001', 'student123', 'STUDENT', 'Bảng điểm của tôi'],
  ]) {
    test(`real ${role}: login, /me, refresh, permissions and logout`, async ({ page }) => {
      await page.goto('/#/login')
      await page.getByLabel('Tên đăng nhập').fill(username)
      await page.getByLabel('Mật khẩu', { exact: true }).fill(password)
      await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
      await expect(page.getByRole('heading', { name: home, exact: true })).toBeVisible()
      await page.reload()
      await expect(page.getByRole('heading', { name: home, exact: true })).toBeVisible()
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem('user')).role)).toBe(role)
      if (role !== 'ADMIN') {
        await page.goto('/#/users')
        await expect(page.getByRole('heading', { name: 'Không có quyền truy cập' })).toBeVisible()
        const status = await page.evaluate(async () => (await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })).status)
        expect(status).toBe(403)
      }
      await page.getByRole('link', { name: 'Đổi mật khẩu' }).click()
      await expect(page.getByLabel('Mật khẩu hiện tại')).toBeVisible()
      await page.getByRole('button', { name: 'Đăng xuất' }).click()
      await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible()
      await page.reload()
      await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible()
    })
  }
  test('real incorrect password returns a visible login error', async ({ page }) => {
    await page.goto('/#/login')
    await page.getByLabel('Tên đăng nhập').fill('admin')
    await page.getByLabel('Mật khẩu', { exact: true }).fill('deliberately-incorrect-test-password')
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('Sai tên đăng nhập hoặc mật khẩu')
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull()
  })
  test('real invalid token is rejected by /me and removed', async ({ page }) => {
    await page.goto('/#/login')
    await page.evaluate(() => localStorage.setItem('token', 'invalid-migration-test-token'))
    await page.goto('/#/users')
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible()
    await expect(page.getByRole('status')).toContainText('hết hạn')
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull()
  })
})
