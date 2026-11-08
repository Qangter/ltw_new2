const labels = {
  PASSED: 'Đạt', FAILED: 'Không đạt', ACTIVE: 'Đang học', GRADUATED: 'Đã tốt nghiệp',
  SUSPENDED: 'Bảo lưu/Đình chỉ', ADMIN: 'Quản trị viên', TEACHER: 'Giáo viên',
  STUDENT: 'Sinh viên', on: 'Hoạt động', off: 'Đã khóa', pending: 'Chưa triển khai',
}

export function Badge({ value, children }) {
  const known = Object.hasOwn(labels, value)
  return <span className={`badge ${known ? value : 'neutral'}`}>{children ?? (known ? labels[value] : value) ?? '—'}</span>
}
