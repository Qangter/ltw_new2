export const genders = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' }
export const studentStatuses = { ACTIVE: 'Đang học', GRADUATED: 'Đã tốt nghiệp', SUSPENDED: 'Bảo lưu/Đình chỉ' }

export function studentDefaults(student) {
  return {
    student_code: student?.student_code ?? '', full_name: student?.full_name ?? '',
    date_of_birth: student?.date_of_birth?.slice(0, 10) ?? '', gender: student?.gender ?? 'MALE',
    class_id: String(student?.class_id ?? ''), admission_year: student?.admission_year ?? new Date().getFullYear(),
    email: student?.email ?? '', phone: student?.phone ?? '', address: student?.address ?? '', status: student?.status ?? 'ACTIVE',
  }
}

export function studentPayload(values, editing) {
  const { full_name, date_of_birth, gender, class_id, admission_year, email, phone, address, status } = values
  const body = { full_name: full_name.trim(), date_of_birth, gender, class_id, admission_year, email: email.trim(), phone: phone.trim(), address: address.trim(), status }
  if (!editing) body.student_code = values.student_code.trim()
  return body
}

export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}
