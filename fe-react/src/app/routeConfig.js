const STAFF = ['ADMIN', 'TEACHER']
const EVERY_ROLE = ['ADMIN', 'TEACHER', 'STUDENT']

// Navigation rules only. The backend remains the authority for every API call.
export const routeConfig = [
  { path: '/login', title: 'Đăng nhập', stage: 3, menu: false, roles: [] },
  { path: '/dashboard', title: 'Tổng quan', stage: 4, roles: STAFF, icon: 'dashboard' },
  { path: '/my', title: 'Bảng điểm của tôi', stage: 4, roles: ['STUDENT'], icon: 'grades' },
  { path: '/lookup', title: 'Tra cứu sinh viên', stage: 4, roles: STAFF, icon: 'lookup' },
  { path: '/student/:id', title: 'Bảng điểm sinh viên', stage: 4, roles: STAFF, menu: false },
  { path: '/entry', title: 'Nhập điểm', stage: 6, roles: STAFF, icon: 'entry' },
  { path: '/import', title: 'Import Excel', stage: 7, roles: STAFF, icon: 'import' },
  { path: '/grades', title: 'Danh sách điểm', stage: 4, roles: STAFF, icon: 'grades' },
  { path: '/stats', title: 'Thống kê đạt/rớt', stage: 4, roles: STAFF, icon: 'stats' },
  { path: '/students', title: 'Quản lý sinh viên', stage: 5, roles: ['ADMIN'], icon: 'users' },
  { path: '/users', title: 'Tài khoản', stage: 5, roles: ['ADMIN'], icon: 'users' },
  { path: '/password', title: 'Đổi mật khẩu', stage: 3, roles: EVERY_ROLE, icon: 'password' },
]

export function getMenuItems(role) {
  return routeConfig.filter((route) => route.menu !== false && route.roles.includes(role))
}

export const homeForRole = (role) => role === 'STUDENT' ? '/my' : '/dashboard'
