import { test, expect } from '@playwright/test'
import { formatNumber } from '../../../../utils/format.js'

// Existing data only: login and GET. No grade/enrollment writes or seed/reset.
test.describe('live entry read-only parity', () => {
  test.skip(process.env.LIVE_AUTH !== '1', 'Requires a running local backend')
  for (const [username, password] of [['admin', 'admin123'], ['teacher01', 'teacher123']]) {
    test(`${username}: semester, offerings and student scores match API`, async ({ page, context, request }) => {
      test.setTimeout(60000)
      const login = await request.post('/api/auth/login', { data: { username, password } })
      expect(login.ok()).toBe(true)
      const session = await login.json()
      const headers = { Authorization: `Bearer ${session.token}` }
      await context.addInitScript(({ token, user }) => { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)) }, session)
      async function get(path) {
        const result = await request.get(path, { headers })
        expect(result.ok()).toBe(true)
        return result.json()
      }
      const meta = await get('/api/meta')
      const semester = meta.semesters.find((item) => item.status === 'ACTIVE') || meta.semesters.at(-1)
      expect(semester).toBeTruthy()
      const offerings = await get(`/api/offerings?semester_id=${semester.id}`)
      await page.goto('/#/entry')
      await expect(page.getByLabel('Học kỳ', { exact: true })).toHaveValue(String(semester.id))
      if (!offerings.length) {
        await expect(page.getByText('Không có lớp học phần trong học kỳ này.')).toBeVisible()
      } else {
        await expect(page.locator('#entry-offering option')).toHaveText(offerings.map((item) => `${item.subject_code} - ${item.subject_name} (${item.enrolled} SV)${session.user.role === 'ADMIN' ? ` - ${item.teacher_name}` : ''}`))
        for (const offering of offerings.slice(0, 2)) {
          const students = await get(`/api/offerings/${offering.id}/students`)
          await page.getByLabel('Lớp học phần', { exact: true }).selectOption(String(offering.id))
          await expect(page.locator('[data-enrollment]')).toHaveCount(students.length)
          // Read whole DOM tables in one call, including every row; avoid thousands
          // of per-cell browser round trips on real classes with >100 students.
          const snapshot = (elements) => elements.map((row) => [
            row.dataset.enrollment,
            ...[...row.cells].slice(0, 8).map((cell) => cell.querySelector('input')?.value ?? cell.textContent.trim()),
          ])
          const expected = students.map((student) => [String(student.enrollment_id), student.student_code, student.full_name,
            ...['attendance_score', 'midterm_score', 'final_score'].map((field) => student[field] == null ? '' : String(student[field])),
            formatNumber(student.total_score), student.letter_grade || '—', { PASSED: 'Đạt', FAILED: 'Không đạt' }[student.result] || '—'])
          await expect.poll(() => page.locator('[data-enrollment]').evaluateAll(snapshot)).toEqual(expected)
          console.log(`LIVE ${username}: offering ${offering.id}, ${students.length} rows match API; GET only`)
        }
      }
      if (username === 'teacher01') {
        const own = await get('/api/offerings')
        const adminLogin = await request.post('/api/auth/login', { data: { username: 'admin', password: 'admin123' } })
        expect(adminLogin.ok()).toBe(true)
        const admin = await adminLogin.json()
        const all = await request.get('/api/offerings', { headers: { Authorization: `Bearer ${admin.token}` } })
        expect(all.ok()).toBe(true)
        const outside = (await all.json()).find((offering) => !own.some((item) => item.id === offering.id))
        expect(outside, 'Existing offering outside teacher scope is needed for real 403 verification').toBeTruthy()
        const denied = await request.get(`/api/offerings/${outside.id}/students`, { headers })
        expect(denied.status()).toBe(403)
        expect((await denied.json()).message).toBe('Đây không phải lớp học phần của bạn')
      }
    })
  }
})
