import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from './useAuth.js'
import { useToast } from '../../hooks/useToast.js'
import { Card } from '../../components/ui/Card.jsx'

export function ChangePasswordPage() {
  const { api } = useAuth()
  const { notify } = useToast()
  const { register, handleSubmit, reset, getValues, formState: { errors } } = useForm()
  const mutation = useMutation({
    mutationFn: ({ old_password, new_password }) => api('/api/auth/change-password', { method: 'POST', body: { old_password, new_password } }),
    onSuccess: (result) => { reset(); notify(result.message, { type: 'success' }) },
  })
  const fields = [
    ['old_password', 'Mật khẩu hiện tại', 'current-password', { required: 'Vui lòng nhập mật khẩu hiện tại.' }],
    ['new_password', 'Mật khẩu mới', 'new-password', { required: 'Vui lòng nhập mật khẩu mới.', minLength: { value: 6, message: 'Mật khẩu mới phải từ 6 ký tự.' } }],
    ['confirm', 'Xác nhận mật khẩu mới', 'new-password', { required: 'Vui lòng xác nhận mật khẩu.', validate: (value) => value === getValues('new_password') || 'Mật khẩu xác nhận không khớp.' }],
  ]
  return <><h1>Đổi mật khẩu</h1><Card title="Cập nhật mật khẩu">
    <form className="auth-form password-form" noValidate onSubmit={handleSubmit((values) => mutation.mutate(values))} aria-busy={mutation.isPending}>
      <fieldset disabled={mutation.isPending}>
        {fields.map(([name, label, autoComplete, rules]) => <div key={name}>
          <label htmlFor={name}>{label}</label>
          <input id={name} type="password" autoComplete={autoComplete} {...register(name, rules)} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${name}-error` : undefined} />
          {errors[name] && <p id={`${name}-error`} className="form-error">{errors[name].message}</p>}
        </div>)}
        <button type="submit">{mutation.isPending ? 'Đang lưu...' : 'Lưu mật khẩu'}</button>
      </fieldset>
      {mutation.error && mutation.error.name !== 'AbortError' && <p className="form-error" role="alert">{mutation.error.message}{mutation.error.status === 0 && ' Yêu cầu có thể đã được xử lý; hãy kiểm tra trước khi gửi lại.'}</p>}
    </form>
  </Card></>
}
