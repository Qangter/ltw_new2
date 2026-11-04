import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loading } from '../../components/feedback/Loading.jsx'
import { ErrorState } from '../../components/feedback/ErrorState.jsx'
import { useAuth } from './useAuth.js'
import { homeForRole } from '../../app/routeConfig.js'

export function VerificationState() {
  const { error, retryVerify, logout } = useAuth()
  return <main className="auth-status">
    <h1>Xác minh phiên đăng nhập</h1>
    {error ? <><ErrorState message={error.message} onRetry={retryVerify} />
      <button type="button" onClick={() => logout()}>Quay lại đăng nhập</button></> : <Loading label="Đang xác minh phiên đăng nhập..." />}
  </main>
}
export function AuthGate() {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'verifying') return <VerificationState />
  if (status !== 'authenticated') return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}
export function RoleGuard({ roles, children }) {
  const { user } = useAuth()
  if (!roles.includes(user?.role)) return <section>
    <h1>Không có quyền truy cập</h1>
    <p role="alert">Bạn không có quyền truy cập trang này (403).</p>
    <Link className="btn" to={homeForRole(user?.role)}>Về trang chính</Link>
  </section>
  return children
}
