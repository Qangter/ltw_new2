import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar.jsx'
import { useAuth } from '../../features/auth/useAuth.js'

export function AppLayout() {
  const { notice } = useAuth()
  return (
    <div className="layout">
      <a className="skip-link" href="#main-content" onClick={(event) => {
        event.preventDefault()
        document.getElementById('main-content')?.focus()
      }}>Đến nội dung chính</a>
      <Sidebar />
      <main className="main" id="main-content" tabIndex={-1}>
        <p className="migration-notice">Các trang tra cứu và thống kê đã sẵn sàng. Quản trị, nhập điểm và import đang được chuyển đổi.</p>
        {notice && <p role="status">{notice}</p>}
        <Outlet />
      </main>
    </div>
  )
}
