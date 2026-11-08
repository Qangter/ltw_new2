import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

// Existing backend XLSX dependency generates/verifies test workbooks only, never shipped to client.
const XLSX = createRequire(new URL('../../../../../../be/package.json', import.meta.url))('xlsx')
const columns = ['student_code', 'full_name', 'subject_code', 'subject_name', 'credits', 'semester_name', 'academic_year', 'score']
function workbook() {
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([columns, ['SV_FIXTURE', 'Fixture', 'WEB01', 'Web', 3, 'HK1', '2026', 0]]), 'Grades')
  return XLSX.write(book, { type: 'buffer', bookType: 'xlsx' })
}
const file = () => ({ name: 'diem-fixture.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: workbook() })

async function fixture(page, handler, role = 'ADMIN') {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'import-fixture')
    const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL)
    window.testBlobURLs = { created: [], revoked: [] }
    URL.createObjectURL = (blob) => { const url = create(blob); window.testBlobURLs.created.push(url); return url }
    URL.revokeObjectURL = (url) => { window.testBlobURLs.revoked.push(url); revoke(url) }
  })
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/auth/me') return route.fulfill({ json: { id: 1, username: 'fixture', full_name: `Fixture ${role}`, role } })
    if (handler) return handler(route, path)
    return route.fulfill({ status: 500, json: { message: 'Unexpected fixture request' } })
  })
}

test('template uses authenticated blob, downloads a workbook and revokes its URL', async ({ page }) => {
  let requests = 0
  await fixture(page, async (route, path) => {
    expect(path).toBe('/api/import/template')
    requests++
    expect(route.request().headers().authorization).toBe('Bearer import-fixture')
    return route.fulfill({ contentType: file().mimeType, body: workbook() })
  })
  await page.goto('/#/import')
  const downloading = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Tải file mẫu' }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('excel_template.xlsx')
  const book = XLSX.read(await readFile(await download.path()), { type: 'buffer' })
  expect(XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { header: 1 })[0]).toEqual(columns)
  expect(requests).toBe(1)
  await expect.poll(() => page.evaluate(() => window.testBlobURLs.revoked)).toEqual(await page.evaluate(() => window.testBlobURLs.created))
  expect(await page.locator('a[download]').count()).toBe(0)
})

for (const width of [360, 1280]) {
  test(`multipart, pending/double click and partial result with 100 row errors at ${width}px (fixture)`, async ({ page }, testInfo) => {
    const uploads = []
    let complete
    const input = file()
    const errors = Array.from({ length: 100 }, (_, index) => ({ row: index + 2, message: ['Không có sinh viên BAD', 'Không có môn BAD', 'Không có học kỳ "BAD"', 'Bạn không dạy môn này trong học kỳ đó'][index % 4] }))
    await fixture(page, async (route, path) => {
      expect(path).toBe('/api/import/grades')
      uploads.push(route.request())
      await new Promise((resolve) => { complete = resolve })
      return route.fulfill({ json: { total: 135, created: 3, updated: 7, failed: 125, errors } })
    }, 'TEACHER')
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/#/import')
    await page.getByLabel('File Excel', { exact: true }).setInputFiles(input)
    await expect(page.getByText(/Đã chọn: diem-fixture.xlsx/)).toBeVisible()
    await page.getByRole('button', { name: 'Import', exact: true }).dblclick()
    await expect.poll(() => uploads.length).toBe(1)
    await expect(page.getByLabel('File Excel', { exact: true })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Đang xử lý...', exact: true })).toBeDisabled()
    await expect(page.getByRole('progressbar')).toHaveCount(0)
    expect(uploads[0].headers()['content-type']).toMatch(/^multipart\/form-data; boundary=/)
    expect(uploads[0].headers().authorization).toBe('Bearer import-fixture')
    expect(uploads[0].postDataBuffer().includes(input.buffer)).toBe(true)
    expect(uploads[0].postDataBuffer().toString('latin1')).toContain('name="file"; filename="diem-fixture.xlsx"')
    complete()
    await expect(page.getByText('Import thành công một phần.')).toBeVisible()
    expect(await page.locator('.import-result .n').allTextContents()).toEqual(['135', '3', '7', '125'])
    await expect(page.getByRole('note')).toContainText('100 trên 125 lỗi')
    await expect(page.getByRole('table', { name: 'Lỗi import' }).locator('tbody tr')).toHaveCount(100)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const tableRegion = page.getByRole('region', { name: 'Lỗi import' })
    expect(await tableRegion.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    const lastRow = tableRegion.locator('tbody tr').last()
    await lastRow.scrollIntoViewIfNeeded()
    await expect(lastRow).toBeVisible()
    await expect(lastRow.locator('td').first()).toHaveText('101')
    await tableRegion.evaluate((element) => { element.scrollTop = 0 })
    await page.screenshot({ path: testInfo.outputPath(`import-${width}.png`), fullPage: true })
  })
}

test('empty/type/limit validation prevents upload; request failures and uncertain network retain file (fixture)', async ({ page }) => {
  let calls = 0, mode = '400'
  await fixture(page, (route) => {
    calls++
    if (mode === 'network') return route.abort('failed')
    return route.fulfill({ status: Number(mode), json: { message: mode === '400' ? 'Không đọc được file Excel' : 'Bạn không có quyền thực hiện thao tác này.' } })
  })
  await page.goto('/#/import')
  const picker = page.getByLabel('File Excel', { exact: true })
  await picker.setInputFiles({ name: 'empty.xlsx', mimeType: '', buffer: Buffer.alloc(0) })
  await expect(page.getByRole('alert')).toContainText('File rỗng')
  await picker.setInputFiles({ name: 'wrong.txt', mimeType: 'text/plain', buffer: Buffer.from('abc') })
  await expect(page.getByRole('alert')).toContainText('đuôi .xlsx')
  await picker.setInputFiles({ name: 'limit.xlsx', mimeType: '', buffer: Buffer.alloc(5 * 1024 * 1024) })
  await expect(page.getByRole('alert')).toContainText('nhỏ hơn 5 MiB')
  expect(calls).toBe(0)
  await picker.setInputFiles(file())
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Yêu cầu import thất bại. Không đọc được file Excel')
  await expect(page.getByLabel('Kết quả import')).toHaveCount(0)
  mode = '403'
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('không có quyền')
  await expect(page.getByRole('heading', { name: 'Import Excel', exact: true })).toBeVisible()
  mode = 'network'
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Chưa xác định được kết quả import')
  await expect(page.getByRole('alert')).toContainText('trước khi gửi lại')
  await expect(page.getByText(/Đã chọn: diem-fixture.xlsx/)).toBeVisible()
  // A new selection must not silently dismiss the uncertain-outcome instruction or resend.
  await picker.setInputFiles({ ...file(), name: 'other.xlsx' })
  await expect(page.getByRole('alert')).toContainText('Chưa xác định')
  expect(calls).toBe(3)
})

test('STUDENT guard never requests import/template (fixture)', async ({ page }) => {
  let businessRequests = 0
  await fixture(page, (route) => { businessRequests++; return route.fulfill({ json: {} }) }, 'STUDENT')
  await page.goto('/#/import')
  await expect(page.getByRole('heading', { name: 'Không có quyền truy cập' })).toBeVisible()
  expect(businessRequests).toBe(0)
})

test('pending import blocks menu, Back and logout until the result can be read (fixture)', async ({ page }) => {
  let finish, calls = 0
  await fixture(page, async (route) => {
    calls++
    await new Promise((resolve) => { finish = resolve })
    return route.fulfill({ json: { total: 1, created: 1, updated: 0, failed: 0, errors: [] } })
  })
  await page.goto('/#/password')
  await page.getByRole('link', { name: 'Import Excel', exact: true }).click()
  await page.getByLabel('File Excel', { exact: true }).setInputFiles(file())
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await expect.poll(() => calls).toBe(1)
  const dialog = page.getByRole('dialog', { name: 'Chờ kết quả import' })
  await page.getByRole('link', { name: 'Danh sách điểm', exact: true }).click()
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/#\/import$/)
  await page.goBack()
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Ở lại xem kết quả' }).click()
  await expect(page).toHaveURL(/#\/import$/)
  await page.getByRole('button', { name: 'Đăng xuất' }).click()
  await expect(dialog).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBe('import-fixture')
  finish()
  await expect(dialog).toContainText('Yêu cầu đã kết thúc')
  await dialog.getByRole('button', { name: 'Ở lại xem kết quả' }).click()
  await expect(page.getByText('Import thành công.', { exact: true })).toBeVisible()
  expect(calls).toBe(1)
  await page.getByRole('button', { name: 'Đăng xuất' }).click()
  await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible()
  await expect(page.getByLabel('Kết quả import')).toHaveCount(0)
})

test.describe('live template read-only', () => {
  test.skip(process.env.LIVE_AUTH !== '1', 'Requires existing local backend; no upload/DB writes')
  for (const [username, password] of [['admin', 'admin123'], ['teacher01', 'teacher123']]) {
    test(`${username}: real template download, workbook headers and URL cleanup`, async ({ page, request, context }) => {
      const response = await request.post('/api/auth/login', { data: { username, password } })
      expect(response.ok()).toBe(true)
      const { token } = await response.json()
      await context.addInitScript((value) => {
        localStorage.setItem('token', value)
        const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL)
        window.testBlobURLs = { created: [], revoked: [] }
        URL.createObjectURL = (blob) => { const url = create(blob); window.testBlobURLs.created.push(url); return url }
        URL.revokeObjectURL = (url) => { window.testBlobURLs.revoked.push(url); revoke(url) }
      }, token)
      await page.goto('/#/import')
      const downloading = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Tải file mẫu' }).click()
      const download = await downloading
      expect(download.suggestedFilename()).toBe('excel_template.xlsx')
      const book = XLSX.read(await readFile(await download.path()), { type: 'buffer' })
      const rows = XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { header: 1 })
      expect(rows[0]).toEqual(columns)
      expect(rows).toHaveLength(2)
      expect(rows[1][0]).toBe('SV0001')
      await expect.poll(() => page.evaluate(() => window.testBlobURLs.revoked.length)).toBe(1)
      expect(await page.evaluate(() => window.testBlobURLs.revoked)).toEqual(await page.evaluate(() => window.testBlobURLs.created))
      console.log(`LIVE ${username}: XLSX template downloaded/parsed, 8 columns and sample row verified; no upload`)
    })
  }
  test('real STUDENT template GET is forbidden', async ({ request }) => {
    const login = await request.post('/api/auth/login', { data: { username: 'student001', password: 'student123' } })
    expect(login.ok()).toBe(true)
    const { token } = await login.json()
    expect((await request.get('/api/import/template', { headers: { Authorization: `Bearer ${token}` } })).status()).toBe(403)
  })
})
