import { test, expect } from '@playwright/test'
import { mockReadApi } from './read-fixtures.js'
import { transcriptFixture, transcriptGradeFixture } from '../src/test/readFixtures.js'
import { formatNumber } from '../src/utils/format.js'

async function mockStaff(page) {
  await mockReadApi(page)
  await page.addInitScript(() => localStorage.setItem('token', 'read-fixture'))
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { id: 1, role: 'ADMIN', full_name: 'Test ADMIN' } }))
}

test('lookup URL filters survive pagination, Back/Forward, refresh and transcript return (fixture)', async ({ page }) => {
  await mockStaff(page)
  await page.goto('/#/lookup?q=SV&class_id=1&page=2')
  await expect(page.getByRole('table', { name: 'Kết quả tra cứu sinh viên' })).toBeVisible()
  await expect(page.getByLabel('Mã số / Họ tên')).toHaveValue('SV')
  await page.getByLabel('Mã số / Họ tên').fill('new query')
  await page.getByRole('button', { name: 'Tìm kiếm' }).click()
  await expect(page).not.toHaveURL(/page=2/)
  await page.getByRole('button', { name: 'Trang 2', exact: true }).click()
  await page.reload()
  await expect(page.getByLabel('Mã số / Họ tên')).toHaveValue('new query')
  await expect(page.getByRole('button', { name: 'Trang 2', exact: true })).toHaveAttribute('aria-current', 'page')
  await page.getByRole('link', { name: 'Xem điểm SVTEST42' }).click()
  await expect(page.getByRole('table', { name: 'Điểm Học kỳ 1' })).toBeVisible()
  await page.getByRole('link', { name: '← Quay lại tra cứu' }).click()
  await expect(page).toHaveURL(/q=new\+query&class_id=1&page=2$/)
  await page.goBack()
  await expect(page).toHaveURL(/#\/student\/42$/)
  await page.goForward()
  await expect(page.getByLabel('Mã số / Họ tên')).toHaveValue('new query')
})

test('grade filters remain unique across apply, pagination, history and reload (fixture)', async ({ page }) => {
  await mockStaff(page)
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/#/grades?q=old&page=2')
  const input = page.getByLabel('Mã / tên SV')
  const table = page.getByRole('table', { name: 'Danh sách điểm' })
  await expect(table).toBeVisible()
  for (const value of ['first', 'second']) {
    await input.fill(value)
    await page.getByRole('button', { name: 'Lọc', exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`#/grades\\?q=${value}$`))
    await expect(input).toHaveCount(1)
    await expect(page.locator('form.read-filters')).toHaveCount(1)
    await expect(table).toHaveCount(1)
    await page.getByRole('button', { name: 'Trang 2', exact: true }).click()
    await expect(page).toHaveURL(/page=2$/)
    await expect(input).toHaveCount(1)
    await page.goBack()
    await expect(page).not.toHaveURL(/page=2/)
    await page.goForward()
    await expect(input).toHaveValue(value)
    await page.reload()
    await expect(input).toHaveCount(1)
    await expect(input).toHaveValue(value)
    await expect(page.getByRole('button', { name: 'Trang 2', exact: true })).toHaveAttribute('aria-current', 'page')
  }
  expect(errors).toEqual([])
})

test('history modal focus/Escape/restore, no write requests, mobile grades table (fixture)', async ({ page }, testInfo) => {
  await mockStaff(page)
  const writes = []
  page.on('request', (request) => { if (request.url().includes('/api/') && request.method() !== 'GET') writes.push(request.method()) })
  await page.setViewportSize({ width: 360, height: 850 })
  await page.goto('/#/grades?semester_id=1&subject_id=1&result=PASSED&page=2')
  const trigger = page.getByRole('button', { name: 'Lịch sử SVTEST42 WEB01' })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Lịch sử sửa điểm' })
  await expect(dialog.getByText('Phúc khảo kiểm thử')).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Đóng hộp thoại' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('button', { name: 'Đóng', exact: true })).toBeFocused()
  await page.screenshot({ path: testInfo.outputPath('history-mobile.png'), animations: 'disabled', fullPage: true })
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(writes).toEqual([])
})

test('long transcript keeps every row/column in print media without scroll clipping (fixture)', async ({ page }, testInfo) => {
  await mockStaff(page)
  const grades = Array.from({ length: 85 }, (_, index) => ({ ...transcriptGradeFixture, grade_id: index + 1, subject_code: `PRINT${String(index + 1).padStart(3, '0')}`, subject_name: 'Tên môn học dài dùng để kiểm tra xuống dòng khi in bảng điểm nhiều trang', semester_id: index < 45 ? 1 : 2, semester_name: index < 45 ? 'Học kỳ 1' : 'Học kỳ 2' }))
  await page.route('**/api/students/42/transcript*', (route) => route.fulfill({ json: { ...transcriptFixture, grades } }))
  await page.goto('/#/student/42')
  await expect(page.locator('.transcript-table tbody tr')).toHaveCount(85)
  await page.setViewportSize({ width: 360, height: 850 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.setViewportSize({ width: 1050, height: 740 })
  await page.emulateMedia({ media: 'print' })
  await expect(page.getByRole('button', { name: 'In bảng điểm' })).not.toBeVisible()
  await expect(page.locator('.sidebar')).not.toBeVisible()
  await expect(page.locator('.read-filters')).not.toBeVisible()
  expect(await page.locator('.transcript-page .table-wrap').evaluateAll((elements) => elements.every((element) => getComputedStyle(element).overflow === 'visible' && element.scrollWidth <= element.clientWidth + 1 && element.scrollHeight <= element.clientHeight + 1))).toBe(true)
  expect(await page.locator('.transcript-table tr').evaluateAll((rows) => rows.every((row) => row.cells.length === 10))).toBe(true)
  await expect(page.getByText('PRINT085', { exact: true })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('transcript-print-top.png'), animations: 'disabled' })
  await page.getByText('PRINT085', { exact: true }).scrollIntoViewIfNeeded()
  await page.screenshot({ path: testInfo.outputPath('transcript-print-last.png'), animations: 'disabled' })
  // Exercise Chrome's paginated print engine, in addition to screen print-media checks.
  const pdf = await page.pdf({ path: testInfo.outputPath('transcript-long.pdf'), preferCSSPageSize: true, printBackground: true })
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
  const pageCount = [...pdf.toString('latin1').matchAll(/\/Type\s*\/Page\b/g)].length
  expect(pageCount).toBeGreaterThan(1)
  console.log(`PRINT: Chrome generated ${pageCount} pages for 85 rows (fixture)`)
})

async function rows(locator) {
  return locator.evaluateAll((elements) => elements.map((row) => [...row.cells].map((cell) => cell.textContent.replace(/\s+/g, ' ').trim())))
}
async function expectTranscript(page, transcript) {
  const groups = new Map()
  for (const grade of transcript.grades) {
    if (!groups.has(grade.semester_id)) groups.set(grade.semester_id, [])
    groups.get(grade.semester_id).push(grade)
  }
  const expected = [...groups.values()].flat().map((grade) => [
    grade.subject_code, grade.subject_name, String(grade.credits), grade.teacher_name || '',
    ...['attendance_score', 'midterm_score', 'final_score', 'total_score'].map((key) => formatNumber(grade[key])),
    grade.letter_grade || '', { PASSED: 'Đạt', FAILED: 'Không đạt' }[grade.result] || grade.result || '—',
  ])
  await expect.poll(() => rows(page.locator('.transcript-table tbody tr'))).toEqual(expected)
  const summary = transcript.summary
  await expect(page.locator('.transcript-summary .n')).toHaveText([
    formatNumber(summary.gpa), String(summary.subjects), summary.passed_credits + '/' + summary.credits, String(summary.failed_subjects),
  ])
}
async function liveSession({ request, context }, username, password) {
  const response = await request.post('/api/auth/login', { data: { username, password } })
  expect(response.ok()).toBe(true)
  const session = await response.json()
  await context.addInitScript(({ token, user }) => { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)) }, session)
  return async (path) => {
    const result = await request.get(path, { headers: { Authorization: `Bearer ${session.token}` } })
    expect(result.ok()).toBe(true)
    return result.json()
  }
}

test.describe('live read-only checks against API', () => {
  test.skip(process.env.LIVE_AUTH !== '1', 'Requires existing local development backend')
  for (const [username, password] of [['admin', 'admin123'], ['teacher01', 'teacher123']]) {
    test(`${username}: dashboard, stats, lookup/page, transcript, grades/history match API`, async ({ page, request, context }) => {
      test.setTimeout(90_000)
      const api = await liveSession({ request, context }, username, password)
      const meta = await api('/api/meta')
      for (const route of ['dashboard', 'stats']) {
        await page.goto(`/#/${route}`)
        const overview = await api('/api/stats/overview')
        const keys = route === 'dashboard' ? ['students', 'teachers', 'subjects', 'classes', 'grades', 'avg_score', 'pass_rate', 'fail_rate'] : ['pass_rate', 'fail_rate', 'avg_score', 'grades']
        await expect(page.locator('.stat .n')).toHaveText(keys.map((key) => formatNumber(overview[key]) + (key.endsWith('_rate') && overview[key] != null ? '%' : '')))
        if (route === 'stats') {
          const subjects = await api('/api/stats/by-subject')
          await expect.poll(() => rows(page.locator('table tbody tr'))).toEqual(subjects.map((item) => [item.subject_code, item.subject_name, formatNumber(item.total), formatNumber(item.avg_score), formatNumber(item.passed), formatNumber(item.pass_rate) + (item.pass_rate == null ? '' : '%')]))
          await expect(page.getByRole('region', { name: 'Phân bố điểm chữ' }).locator('.bar-row')).toHaveCount((await api('/api/stats/distribution')).length)
        } else {
          await expect(page.locator('.pie-legend-item')).toHaveCount((await api('/api/stats/distribution')).length + (await api('/api/stats/by-department')).length)
        }
      }
      const list = await api('/api/students?page=2&limit=10')
      expect(list.data.length).toBeGreaterThan(0)
      await page.goto('/#/lookup?page=2')
      await expect.poll(() => rows(page.locator('table tbody tr')).then((items) => items.map((row) => row.slice(0, 5)))).toEqual(list.data.map((item) => [item.student_code, item.full_name, item.class_code, item.major_name, item.department_name]))
      const student = list.data[0]
      await page.getByLabel('Mã số / Họ tên').fill(student.student_code)
      await page.getByLabel('Lớp').selectOption(String(student.class_id))
      await page.getByRole('button', { name: 'Tìm kiếm' }).click()
      await expect(page.locator('table tbody tr')).toHaveCount(1)
      await expect(page.locator('table tbody tr')).toContainText(student.student_code)
      await page.goto(`/#/student/${student.id}`)
      for (const semester of ['', String(meta.semesters[0].id)]) {
        await expect(page.getByLabel('Lọc theo học kỳ')).toBeEnabled()
        await page.getByLabel('Lọc theo học kỳ').selectOption(semester)
        const transcript = await api(`/api/students/${student.id}/transcript?semester_id=${semester}`)
        await expectTranscript(page, transcript)
      }
      await page.goto('/#/grades?page=2')
      const gradePage = await api('/api/grades?page=2&limit=15')
      await expect(page.locator('table tbody tr')).toHaveCount(gradePage.data.length)
      await expect.poll(() => rows(page.locator('table tbody tr')).then((items) => items.map((row) => row[0]))).toEqual(gradePage.data.map((item) => item.student_code))
      // Bounded read-only sampling for a real history, never seed/edit grades to make this test pass.
      const selected = gradePage.data.find((grade) => Number(grade.edits) > 0)
        || (await api('/api/grades?page=1&limit=100')).data.find((grade) => Number(grade.edits) > 0)
        || gradePage.data[0]
      const semester = meta.semesters.find((item) => item.semester_name === selected.semester_name)
      const subject = meta.subjects.find((item) => item.subject_code === selected.subject_code)
      await page.getByLabel('Mã / tên SV').fill(selected.student_code)
      await page.getByLabel('Học kỳ', { exact: true }).selectOption(String(semester.id))
      await page.getByLabel('Môn học', { exact: true }).selectOption(String(subject.id))
      await page.getByLabel('Kết quả', { exact: true }).selectOption(selected.result)
      await page.getByRole('button', { name: 'Lọc', exact: true }).click()
      await expect(page.locator('table tbody tr')).toHaveCount(1)
      await expect(page.locator('table tbody tr')).toContainText(selected.student_code)
      if (Number(selected.edits) > 0) {
        await page.getByRole('button', { name: `Lịch sử ${selected.student_code} ${selected.subject_code}` }).click()
        const history = await api(`/api/grades/${selected.id}/history`)
        await expect(page.getByRole('dialog').locator('tbody tr')).toHaveCount(history.length)
        const actual = await rows(page.getByRole('dialog').locator('tbody tr'))
        // Compare history values and result badges to the API.
        const resultLabel = (value) => ({ PASSED: 'Đạt', FAILED: 'Không đạt' }[value] || value || '—')
        expect(actual).toEqual(history.map((row) => [row.changed_at,
          `${formatNumber(row.old_score)}${resultLabel(row.old_result)}`,
          `${formatNumber(row.new_score)}${resultLabel(row.new_result)}`,
          row.changed_by || '', row.reason]))
        console.log(`LIVE ${username}: compared ${history.length} history rows; read-only`)
      } else {
        expect(await api(`/api/grades/${selected.id}/history`)).toEqual([])
        await expect(page.getByRole('button', { name: /^Lịch sử / })).toHaveCount(0)
        console.log(`LIVE ${username}: sampled grades have no edits; empty history API verified, populated modal covered by fixture only`)
      }
    })
  }
  test('STUDENT own transcript matches API for each scope; arbitrary student route denied', async ({ page, request, context }) => {
    const api = await liveSession({ request, context }, 'student001', 'student123')
    const meta = await api('/api/meta')
    await page.goto('/#/my')
    for (const semester of ['', String(meta.semesters[0].id)]) {
      await expect(page.getByLabel('Lọc theo học kỳ')).toBeEnabled()
      await page.getByLabel('Lọc theo học kỳ').selectOption(semester)
      const data = await api(`/api/students/me/transcript?semester_id=${semester}`)
      await expectTranscript(page, data)
    }
    await page.goto('/#/student/42')
    await expect(page.getByRole('heading', { name: 'Không có quyền truy cập' })).toBeVisible()
  })
})
