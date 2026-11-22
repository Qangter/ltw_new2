import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, matchPath, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth.js'
import { VerificationState } from './AuthGate.jsx'
import { homeForRole, routeConfig } from '../../app/routeConfig.js'
import logo from '../../assets/images/logo.png'

const heroSlides = ['Tra cứu điểm thi trực tuyến', 'Eduresult']

export function LoginPage() {
  const { status, user, login, notice } = useAuth()
  const location = useLocation()
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm()
  const [heroSlide, setHeroSlide] = useState(0)

  useEffect(() => {
    if (status !== 'anonymous') return undefined
    const timer = window.setInterval(() => {
      setHeroSlide((current) => (current + 1) % heroSlides.length)
    }, 3600)
    return () => window.clearInterval(timer)
  }, [status])

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

  return <main className="login-shell">
    <section className="login-card" aria-label="Đăng nhập Eduresult">
      <aside className="login-story" aria-labelledby="login-story-title">
        <div className="login-story-brand">
          <img className="login-story-brand-logo" src={logo} alt="Eduresult" />
        </div>
        <div className="login-story-copy">
          <p className="login-story-kicker">KẾT QUẢ HỌC TẬP TRỰC TUYẾN</p>
          <h2 className="login-story-title" id="login-story-title" aria-live="off">
            <span key={heroSlides[heroSlide]} className="login-story-word">
              {heroSlide === 1 ? <><span className="login-story-accent">Edu</span>result</> : <>Tra cứu <span className="login-story-accent">điểm thi</span> trực tuyến</>}
            </span>
          </h2>
          <p className="login-story-caption">Kết nối hành trình học tập của bạn với thông tin rõ ràng, an toàn và thuận tiện.</p>
        </div>
        <div className="login-story-foot" aria-hidden="true">
          <span className="login-story-foot-dot" />
          <span>Một cổng thông tin cho mọi kết quả</span>
        </div>
      </aside>

      <div className="login-panel">
        <div className="login-panel-content">
          <header className="login-heading">
            <p className="login-section-kicker">CHÀO MỪNG BẠN</p>
            <h1 id="login-title">Đăng nhập</h1>
            <p>Nhập thông tin tài khoản để tiếp tục.</p>
          </header>

          {notice && <p className="login-notice" role="status">{notice}</p>}

          <form className="auth-form login-form" onSubmit={submit} noValidate aria-busy={isSubmitting}>
            <fieldset className="login-fields" disabled={isSubmitting}>
              <div className="login-field">
                <label htmlFor="username">Tên đăng nhập</label>
                <input className="login-input" id="username" autoComplete="username" aria-invalid={!!errors.username}
                  aria-describedby={errors.username ? 'username-error' : undefined}
                  {...register('username', { validate: (value) => !!value?.trim() || 'Vui lòng nhập tên đăng nhập.' })} />
                {errors.username && <p className="form-error" id="username-error">{errors.username.message}</p>}
              </div>
              <div className="login-field">
                <label htmlFor="password">Mật khẩu</label>
                <input className="login-input" id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password', { required: 'Vui lòng nhập mật khẩu.' })} />
                {errors.password && <p className="form-error" id="password-error">{errors.password.message}</p>}
              </div>
              <button className="login-submit" type="submit">{isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
            </fieldset>
            {errors.root && <p className="form-error login-root-error" role="alert">{errors.root.message}</p>}
          </form>

          <footer className="login-panel-footer">
            <span className="login-footer-mark" aria-hidden="true">✓</span>
            <p>Thông tin tài khoản được quản lý bởi nhà trường.</p>
          </footer>
        </div>
      </div>
    </section>
  </main>
}
