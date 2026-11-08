import { useForm } from 'react-hook-form'
import { Navigate, matchPath, useLocation } from 'react-router-dom'
import logo from '../../../../fe/assets/images/logo.png'
import { useAuth } from './useAuth.js'
import { VerificationState } from './AuthGate.jsx'
import { homeForRole, routeConfig } from '../../app/routeConfig.js'

export function LoginPage() {
  const { status, user, login, notice } = useAuth()
  const location = useLocation()
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm()
  if (status === 'verifying') return <VerificationState />
  if (status === 'authenticated') {
    const from = location.state?.from
    const route = typeof from === 'string' && routeConfig.find((item) => matchPath(item.path, from.split('?')[0]) && item.roles.includes(user.role))
    return <Navigate to={route ? from : homeForRole(user.role)} replace />
  }
  const submit = handleSubmit(async ({ username, password }) => {
    try { await login({ username: username.trim(), password }) }
    catch (error) { if (error.name !== 'AbortError') setError('root', { message: error.message }) }
  })
  return <main className="login-wrap">
    <section className="login-card" aria-labelledby="login-title">
      <img className="login-logo" src={logo} alt="Tra cứu kết quả thi" />
      <p className="eyebrow">CỔNG HỌC VỤ</p>
      <h1 id="login-title">Đăng nhập</h1>
      {notice && <p role="status">{notice}</p>}
      <form className="auth-form" onSubmit={submit} noValidate aria-busy={isSubmitting}>
        <fieldset disabled={isSubmitting}>
          <label htmlFor="username">Tên đăng nhập</label>
          <input id="username" autoComplete="username" aria-invalid={!!errors.username} aria-describedby={errors.username ? 'username-error' : undefined}
            {...register('username', { validate: (value) => !!value?.trim() || 'Vui lòng nhập tên đăng nhập.' })} />
          {errors.username && <p className="form-error" id="username-error">{errors.username.message}</p>}
          <label htmlFor="password">Mật khẩu</label>
          <input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password', { required: 'Vui lòng nhập mật khẩu.' })} />
          {errors.password && <p className="form-error" id="password-error">{errors.password.message}</p>}
          <button type="submit">{isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
        </fieldset>
        {errors.root && <p className="form-error" role="alert">{errors.root.message}</p>}
      </form>
    </section>
  </main>
}
