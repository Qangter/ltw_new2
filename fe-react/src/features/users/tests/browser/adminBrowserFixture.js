import { adminMeta, adminStudent, adminUsers, adminPage } from '../adminFixtures.js'

// Synthetic HTTP fixture; intercepts all API traffic so these scenarios cannot write a DB.
export async function mockAdministration(page, role = 'ADMIN') {
  const state = { students: [{ ...adminStudent }], users: adminUsers.map((user) => ({ ...user })), writes: [], unexpected: [], errors: {}, gates: {} }
  await page.addInitScript(() => localStorage.setItem('token', 'admin-browser-fixture'))
  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const { pathname, searchParams } = new URL(request.url())
    const method = request.method()
    const key = `${method} ${pathname}`
    const body = request.postData() ? request.postDataJSON() : undefined
    if (method !== 'GET') state.writes.push({ path: pathname, method, body })
    if (state.gates[key]) await state.gates[key]
    if (state.errors[key]) return route.fulfill({ status: state.errors[key].status, json: { message: state.errors[key].message } })
    if (method === 'GET') {
      if (pathname === '/api/auth/me') return route.fulfill({ json: { id: 1, username: 'admin-fixture', full_name: `Fixture ${role}`, role } })
      if (pathname === '/api/meta') return route.fulfill({ json: adminMeta })
      if (pathname === '/api/students' || pathname === '/api/admin/users') {
        const limit = pathname === '/api/students' ? 12 : 15
        const current = Number(searchParams.get('page') || 1)
        let rows = pathname === '/api/students' ? state.students : state.users
        const q = (searchParams.get('q') || '').toLowerCase()
        if (q) rows = rows.filter((row) => [row.student_code, row.username, row.full_name].some((value) => value?.toLowerCase().includes(q)))
        for (const field of ['class_id', 'status', 'role']) if (searchParams.get(field)) rows = rows.filter((row) => String(row[field]) === searchParams.get(field))
        return route.fulfill({ json: adminPage(rows.slice((current - 1) * limit, current * limit), { limit, page: current, total: rows.length }) })
      }
    }
    if (pathname === '/api/students' && method === 'POST') {
      state.students.push({ ...body, id: 43, class_code: adminMeta.classes.find((item) => String(item.id) === String(body.class_id))?.class_code })
      return route.fulfill({ status: 201, json: { id: 43, message: 'Đã thêm sinh viên. Tài khoản: svnew43' } })
    }
    if (/^\/api\/students\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').at(-1))
      if (method === 'PUT') {
        state.students = state.students.map((student) => student.id === id ? { ...student, ...body } : student)
        return route.fulfill({ json: { message: 'Đã cập nhật sinh viên' } })
      }
      if (method === 'DELETE') {
        state.students = state.students.filter((student) => student.id !== id)
        return route.fulfill({ json: { message: 'Đã xóa sinh viên' } })
      }
    }
    if (/^\/api\/admin\/users\/\d+\/active$/.test(pathname) && method === 'PATCH') {
      const id = Number(pathname.split('/').at(-2))
      state.users = state.users.map((user) => user.id === id ? { ...user, is_active: body.is_active } : user)
      return route.fulfill({ json: { message: body.is_active ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản' } })
    }
    if (/^\/api\/admin\/users\/\d+\/reset-password$/.test(pathname) && method === 'POST') {
      return route.fulfill({ json: { message: 'Đã đặt lại mật khẩu về mặc định (student123)' } })
    }
    state.unexpected.push(key)
    return route.abort()
  })
  return state
}
