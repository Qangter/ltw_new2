// Deterministic synthetic records. Never imported by application code.
export const adminStudent = {
  id: 42, student_code: 'SVTEST42', full_name: 'Sinh viên quản trị', date_of_birth: '2003-01-02',
  gender: 'MALE', class_id: 1, class_code: 'CNTT01', admission_year: 2021, status: 'ACTIVE',
  email: 'old@example.test', phone: '0901234567', address: 'Địa chỉ kiểm thử',
}
export const adminUsers = [
  { id: 1, username: 'admin', full_name: 'Quản trị viên hiện tại', role: 'ADMIN', is_active: 1 },
  { id: 9, username: 'svtest42', full_name: adminStudent.full_name, role: 'STUDENT', is_active: 1 },
]
export const adminMeta = { classes: [{ id: 1, class_code: 'CNTT01' }, { id: 2, class_code: 'CNTT02' }], subjects: [], semesters: [] }
export function adminPage(data, { page = 1, limit = 12, total = data.length } = {}) {
  return { data, page, total, limit, pages: Math.ceil(total / limit) }
}
