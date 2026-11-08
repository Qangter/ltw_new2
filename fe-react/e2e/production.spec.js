import { test, expect } from '@playwright/test'
import { mockReadApi } from './read-fixtures.js'

test('Express production serves compiled assets, JSON API failures and no HTML fallback', async ({ request, baseURL }) => {
  test.skip(new URL(baseURL).port !== '5181', 'Production Express config only')
  const root = await request.get('/')
  expect(root.status()).toBe(200)
  expect(root.headers()['cache-control']).toBe('no-cache')
  const html = await root.text()
  expect(html).not.toContain('/@vite/client')
  expect(html).not.toContain('/src/main.jsx')
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1])
  expect(assets.length).toBeGreaterThanOrEqual(2)
  for (const asset of assets) {
    const response = await request.get(asset)
    expect(response.status()).toBe(200)
    expect(response.headers()['cache-control']).toContain('immutable')
    expect(response.headers()['content-type']).toMatch(/javascript|css/)
  }
  for (const method of ['GET', 'POST']) {
    const api = await request.fetch('/api/migration-does-not-exist', { method })
    expect(api.status()).toBe(404)
    expect(api.headers()['content-type']).toContain('application/json')
    expect(await api.json()).toEqual({ message: 'API không tồn tại' })
  }
  const me = await request.get('/api/auth/me')
  expect(me.status()).toBe(401)
  expect(me.headers()['content-type']).toContain('application/json')
  for (const path of ['/assets/missing.js', '/not-a-hash-route']) {
    const response = await request.get(path)
    expect(response.status()).toBe(404)
    expect(response.headers()['content-type']).toContain('text/plain')
  }
})

test('direct hash/refresh, invalid hash and keyboard skip link on built pages (fixture API)', async ({ page }) => {
  await mockReadApi(page)
  await page.addInitScript(() => localStorage.setItem('token', 'production-fixture'))
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { id: 1, role: 'ADMIN', full_name: 'Production fixture' } }))
  await page.goto('/#/student/42')
  await expect(page.getByRole('heading', { name: 'Bảng điểm sinh viên' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Bảng điểm sinh viên' })).toBeVisible()
  expect(await page.locator('.brand-logo').evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true)
  const skip = page.getByRole('link', { name: 'Đến nội dung chính' })
  expect((await skip.boundingBox()).y + (await skip.boundingBox()).height).toBeLessThanOrEqual(0)
  await page.keyboard.press('Tab')
  await expect(skip).toBeFocused()
  await expect(skip).toBeInViewport()
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()
  await expect(page).toHaveURL(/#\/student\/42$/)
  await page.goto('/#/unknown-migration-route')
  await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible()
})
