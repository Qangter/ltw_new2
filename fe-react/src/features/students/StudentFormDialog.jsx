import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '../../components/overlay/Modal.jsx'
import { useAuth } from '../auth/useAuth.js'
import { useAdminMutation } from '../users/useAdminMutation.js'
import { adminErrorMessage } from '../users/adminFeedback.js'
import { createStudent, updateStudent, studentResources } from './studentService.js'
import { genders, studentStatuses, studentDefaults, studentPayload, validDate } from './studentForm.js'
import './students.css'

export function StudentFormDialog({ student, classes, onClose, onSaved }) {
  const { api } = useAuth()
  const prefix = useId()
  const editing = !!student
  const { register, handleSubmit, setError, formState: { errors } } = useForm({ defaultValues: studentDefaults(student) })
  const mutation = useAdminMutation({
    mutationFn: (values) => editing ? updateStudent(api, student.id, studentPayload(values, true)) : createStudent(api, studentPayload(values, false)),
    resources: studentResources,
    onSuccess: onSaved,
    onError: (error) => {
      if (!editing && error.status === 409) setError('student_code', { type: 'server', message: error.message }, { shouldFocus: true })
      if (error.status === 400 && error.message === 'Lớp không tồn tại') setError('class_id', { type: 'server', message: error.message }, { shouldFocus: true })
    },
  })
  const required = (message) => ({ validate: (value) => !!String(value ?? '').trim() || message })
  const fields = [
    { name: 'student_code', label: 'Mã sinh viên', readOnly: editing, rules: editing ? {} : { required: 'Vui lòng nhập mã sinh viên.', pattern: { value: /^[A-Za-z0-9]{3,30}$/, message: 'Mã sinh viên gồm 3–30 chữ/số, không dấu.' } } },
    { name: 'full_name', label: 'Họ tên', rules: { ...required('Vui lòng nhập họ tên.'), maxLength: { value: 150, message: 'Họ tên tối đa 150 ký tự.' } } },
    { name: 'date_of_birth', label: 'Ngày sinh', type: 'date', rules: { required: 'Vui lòng chọn ngày sinh.', validate: (value) => validDate(value) || 'Ngày sinh không hợp lệ.' } },
    { name: 'gender', label: 'Giới tính', options: Object.entries(genders), rules: { validate: (value) => Object.hasOwn(genders, value) || 'Giới tính không hợp lệ.' } },
    { name: 'class_id', label: 'Lớp', options: [['', 'Chọn lớp'], ...classes.map((item) => [String(item.id), item.class_code])], rules: { required: 'Vui lòng chọn lớp.', validate: (value) => classes.some((item) => String(item.id) === value) || 'Lớp không còn trong danh mục. Vui lòng chọn lại.' } },
    { name: 'admission_year', label: 'Năm nhập học', type: 'number', rules: { required: 'Vui lòng nhập năm nhập học.', validate: (value) => /^\d{4}$/.test(String(value)) || 'Năm nhập học phải gồm 4 chữ số.' } },
    { name: 'email', label: 'Email', type: 'email', rules: { maxLength: { value: 150, message: 'Email tối đa 150 ký tự.' }, validate: (value) => !value.trim() || /^[^\s@]+@[^\s@]+$/.test(value.trim()) || 'Email không hợp lệ.' } },
    { name: 'phone', label: 'Điện thoại', type: 'tel', rules: { maxLength: { value: 20, message: 'Điện thoại tối đa 20 ký tự.' } } },
    { name: 'address', label: 'Địa chỉ', full: true, rules: { maxLength: { value: 255, message: 'Địa chỉ tối đa 255 ký tự.' } } },
    { name: 'status', label: 'Trạng thái', options: Object.entries(studentStatuses), rules: { validate: (value) => Object.hasOwn(studentStatuses, value) || 'Trạng thái không hợp lệ.' } },
  ]
  function bind(name, rules) {
    return register(name, { ...rules, onChange: () => {
      if (mutation.error) mutation.reset()
    } })
  }
  return <Modal open title={editing ? `Sửa sinh viên ${student.student_code}` : 'Thêm sinh viên'} onClose={onClose} dismissible={!mutation.isPending}>
    {!editing && <p className="muted">Tài khoản: tên đăng nhập = mã SV (chữ thường), mật khẩu mặc định student123.</p>}
    {editing && <p className="muted">Email ở đây thuộc hồ sơ sinh viên; thay đổi này không đổi email tài khoản.</p>}
    <form noValidate onSubmit={handleSubmit(mutation.submit)} aria-busy={mutation.isPending} className="student-admin-form">
      <fieldset disabled={mutation.isPending} className="form-grid">
        {fields.map(({ name, label, type = 'text', rules, options, readOnly, full }) => <div key={name} className={full ? 'full' : undefined}>
          <label htmlFor={`${prefix}-${name}`}>{label}</label>
          {options ? <select id={`${prefix}-${name}`} {...bind(name, rules)} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${prefix}-${name}-error` : undefined}>
            {name === 'class_id' && student?.class_id && !classes.some((item) => String(item.id) === String(student.class_id)) && <option value={String(student.class_id)}>Lớp {student.class_code || student.class_id} (không còn trong danh mục)</option>}
            {options.map(([value, text]) => <option value={value} key={value}>{text}</option>)}
          </select> : <input id={`${prefix}-${name}`} type={type} readOnly={readOnly} {...bind(name, rules)} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${prefix}-${name}-error` : undefined} />}
          {errors[name] && <p className="form-error" id={`${prefix}-${name}-error`}>{errors[name].message}</p>}
        </div>)}
      </fieldset>
      {mutation.error && <p className="form-error" role="alert">{adminErrorMessage(mutation.error)}</p>}
      <div className="actions">
        <button type="button" className="sec" disabled={mutation.isPending} onClick={onClose}>Hủy</button>
        <button type="submit" disabled={mutation.isPending || !classes.length}>{mutation.isPending ? 'Đang lưu...' : 'Lưu sinh viên'}</button>
      </div>
    </form>
  </Modal>
}
