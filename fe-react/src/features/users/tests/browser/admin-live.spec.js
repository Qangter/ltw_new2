import { randomUUID } from 'node:crypto'
import { test, expect } from '@playwright/test'

// Opt-in only AFTER the operator identifies the proxy target as development/test.
// No mocks, SQL, seed/reset, or mutations of pre-existing students/accounts.
test('live administration on one newly created student/account', async ({ page, request, context, baseURL }, testInfo) => {
  test.skip(process.env.LIVE_ADMIN_WRITES !== '1' || !['development', 'test'].includes(process.env.ADMIN_TEST_ENV),
    'Requires explicit development/test identification and LIVE_ADMIN_WRITES=1')
  test.setTimeout(90_000)
  expect(['localhost', '127.0.0.1', '[::1]']).toContain(new URL(baseURL).hostname)
  const code = `R5${randomUUID().replaceAll('-', '').slice(0, 24)}`
  const username = code.toLowerCase()
  const email = `${username}@example.test`
  const name = `Kiểm thử React 5 ${code}`
  let studentId
  let deleted = false
  const writes = []
  page.on('request', (req) => {
    if (new URL(req.url()).pathname.startsWith('/api/') && req.method() !== 'GET') {
      writes.push({ method: req.method(), path: new URL(req.url()).pathname })
    }
  })
  async function login(user, password, status = 200) {
    const response = await request.post('/api/auth/login', { data: { username: user, password } })
    expect(response.status()).toBe(status)
    return status === 200 ? response.json() : null
  }
  const admin = await login('admin', 'admin123')
  const headers = { Authorization: `Bearer ${admin.token}` }
  const get = async (path) => {
    const response = await request.get(path, { headers })
    expect(response.status()).toBe(200)
    return response.json()
  }
  const findStudents = () => get(`/api/students?q=${code}`)
  const findUsers = () => get(`/api/admin/users?q=${username}`)
  expect((await findStudents()).data).toEqual([])
  expect((await findUsers()).data).toEqual([])
  const meta = await get('/api/meta')
  expect(meta.classes.length).toBeGreaterThan(0)
  const classId = String(meta.classes[0].id)
  await context.addInitScript((token) => localStorage.setItem('token', token), admin.token)
  const dialog = page.getByRole('dialog')
  async function fillCreate() {
    await page.getByRole('button', { name: '＋ Thêm sinh viên' }).click()
    await dialog.getByLabel('Mã sinh viên').fill(code)
    await dialog.getByLabel('Họ tên', { exact: true }).fill(name)
    await dialog.getByLabel('Ngày sinh').fill('2004-02-29')
    await dialog.getByLabel('Lớp', { exact: true }).selectOption(classId)
    await dialog.getByLabel('Năm nhập học').fill('2024')
    await dialog.getByLabel('Email', { exact: true }).fill(email)
  }
  async function confirmAccount(action) {
    await page.getByRole('button', { name: `${action} ${username}`, exact: true }).click()
    await expect(dialog).toHaveAccessibleDescription(new RegExp(username))
    const label = action === 'Đặt lại mật khẩu' ? action : `${action} tài khoản`
    await dialog.getByRole('button', { name: label, exact: true }).click()
    await expect(dialog).not.toBeVisible()
  }
  try {
    // Warm an empty account cache before creation; subsequent navigation must see invalidation.
    await page.goto(`/#/users?q=${username}&role=STUDENT`)
    await expect(page.getByText('Không có tài khoản phù hợp.')).toBeVisible()
    await page.getByRole('navigation').getByRole('link', { name: 'Quản lý sinh viên', exact: true }).click()
    await page.getByLabel('Mã / tên').fill(code)
    await page.getByRole('button', { name: 'Lọc', exact: true }).click()
    await expect(page.getByText('Không có sinh viên phù hợp.')).toBeVisible()
    await fillCreate()
    const createdPromise = page.waitForResponse((res) => new URL(res.url()).pathname === '/api/students' && res.request().method() === 'POST')
    await dialog.getByRole('button', { name: 'Lưu sinh viên' }).click()
    const created = await createdPromise
    expect(created.status()).toBe(201)
    studentId = (await created.json()).id
    expect(Number.isInteger(studentId)).toBe(true)
    console.log(`LIVE ADMIN test-owned student ${code}, id ${studentId}`)
    await expect(dialog).not.toBeVisible()
    await expect(page.getByRole('table')).toContainText(code)
    expect((await findStudents()).data).toHaveLength(1)
    const account = (await findUsers()).data.find((user) => user.username === username)
    expect(account).toMatchObject({ role: 'STUDENT', full_name: name, email, is_active: 1 })
    const studentSession = await login(username, 'student123')

    // Duplicate creation must retain the form and show the actual backend 409.
    await fillCreate()
    await dialog.getByRole('button', { name: 'Lưu sinh viên' }).click()
    await expect(dialog.getByRole('alert')).toContainText('đã tồn tại')
    await expect(dialog.getByLabel('Mã sinh viên')).toHaveAttribute('aria-invalid', 'true')
    await expect(dialog.getByLabel('Họ tên', { exact: true })).toHaveValue(name)
    await dialog.getByRole('button', { name: 'Hủy', exact: true }).click()

    const editedName = `${name} sửa`
    await page.getByRole('button', { name: `Sửa ${code}`, exact: true }).click()
    await expect(dialog.getByLabel('Mã sinh viên')).toHaveAttribute('readonly', '')
    await dialog.getByLabel('Họ tên', { exact: true }).fill(editedName)
    await dialog.getByLabel('Email', { exact: true }).fill(`edited-${email}`)
    await dialog.getByRole('button', { name: 'Lưu sinh viên' }).click()
    await expect(dialog).not.toBeVisible()
    await expect(page.getByRole('table')).toContainText(editedName)
    expect((await findStudents()).data[0]).toMatchObject({ id: studentId, full_name: editedName, email: `edited-${email}` })
    expect((await findUsers()).data[0]).toMatchObject({ id: account.id, full_name: editedName, email })

    // Browser Back returns to the cached account query; creation/edit must both be visible.
    await page.goBack() // students without filter
    await page.goBack() // warmed users query
    await expect(page).toHaveURL(new RegExp(`#/users\\?q=${username}&role=STUDENT$`))
    await expect(page.getByRole('table')).toContainText(editedName)
    await confirmAccount('Khóa')
    expect((await findUsers()).data[0].is_active).toBe(0)
    await login(username, 'student123', 403)
    await confirmAccount('Mở khóa')
    expect((await findUsers()).data[0].is_active).toBe(1)
    await login(username, 'student123')

    // Set a non-default password on ONLY the new test account to prove reset has an effect.
    const temporaryPassword = `Test-${randomUUID()}`
    const changed = await request.post('/api/auth/change-password', {
      headers: { Authorization: `Bearer ${studentSession.token}` },
      data: { old_password: 'student123', new_password: temporaryPassword },
    })
    expect(changed.status()).toBe(200)
    await login(username, temporaryPassword)
    await confirmAccount('Đặt lại mật khẩu')
    await expect(page.getByRole('status').filter({ hasText: username })).toContainText('student123')
    await login(username, 'student123')
    await login(username, temporaryPassword, 401)

    // Server authorization is checked against only our new records, never existing accounts.
    const teacher = await login('teacher01', 'teacher123')
    for (const session of [teacher, studentSession]) {
      const deniedHeaders = { Authorization: `Bearer ${session.token}` }
      for (const [method, path, data] of [
        ['PUT', `/api/students/${studentId}`, { full_name: 'Must not be written' }],
        ['DELETE', `/api/students/${studentId}`],
        ['PATCH', `/api/admin/users/${account.id}/active`, { is_active: false }],
        ['POST', `/api/admin/users/${account.id}/reset-password`],
      ]) {
        const denied = await request.fetch(path, { method, headers: deniedHeaders, data })
        expect(denied.status()).toBe(403)
      }
    }
    expect((await findStudents()).data[0].full_name).toBe(editedName)
    expect((await findUsers()).data[0].is_active).toBe(1)

    await page.getByRole('navigation').getByRole('link', { name: 'Quản lý sinh viên', exact: true }).click()
    await page.getByLabel('Mã / tên').fill(code)
    await page.getByRole('button', { name: 'Lọc', exact: true }).click()
    await page.getByRole('button', { name: `Xóa ${code}`, exact: true }).click()
    await expect(dialog).toHaveAccessibleDescription(new RegExp(code))
    await dialog.getByRole('button', { name: 'Xóa sinh viên', exact: true }).click()
    await expect(dialog).not.toBeVisible()
    await expect(page.getByText('Không có sinh viên phù hợp.')).toBeVisible()
    expect((await findStudents()).data).toEqual([])
    expect((await findUsers()).data).toEqual([])
    deleted = true
    await page.goBack()
    await page.goBack()
    await expect(page.getByText('Không có tài khoản phù hợp.')).toBeVisible()
    expect(writes.map(({ method }) => method)).toEqual(['POST', 'POST', 'PUT', 'PATCH', 'PATCH', 'POST', 'DELETE'])
    console.log(`LIVE ADMIN passed CRUD/409/cache/lock/unlock/reset/403; removed test-owned ${code}`)
  } finally {
    // Never clean up by broad prefix or guessed ID. Ownership comes from this run's 201 response.
    if (studentId && !deleted) {
      const own = (await findStudents()).data.find((student) => student.id === studentId && student.student_code === code)
      if (own) {
        const response = await request.delete(`/api/students/${studentId}`, { headers })
        expect(response.status(), `Cleanup failed for test-owned ${code}, id ${studentId}`).toBe(200)
      }
      expect((await findStudents()).data).toEqual([])
      expect((await findUsers()).data).toEqual([])
      console.log(`LIVE ADMIN cleanup verified for test-owned ${code}`)
    }
    await testInfo.attach('test-owned-record', { body: JSON.stringify({ code, studentId, deleted }), contentType: 'application/json' })
  }
})
