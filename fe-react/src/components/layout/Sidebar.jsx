import { Link, useLocation } from 'react-router-dom'
import logo from '../../../../fe/assets/images/logo.png'
import { getMenuItems, homeForRole } from '../../app/routeConfig.js'
import { useAuth } from '../../features/auth/useAuth.js'
import { Badge } from '../ui/Badge.jsx'

const icons = {
  dashboard: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  lookup: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14m5 12 6 6',
  entry: 'M4 20h4L20 8l-4-4L4 16v4M13 7l4 4',
  import: 'M12 3v12m-5-5 5 5 5-5M4 21h16',
  grades: 'M4 5h16v14H4zM4 10h16M9 5v14M15 5v14',
  stats: 'M4 5v14h16M7 15l3-4 3 2 5-7',
  users: 'M9 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6M3 21v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m1 3a5 5 0 0 1 4 5v2',
  password: 'M5 10h14v11H5zM8 10V7a4 4 0 0 1 8 0v3M12 14v3',
}

export function Sidebar() {
  const { user, logout } = useAuth()
  const role = user?.role
  const { pathname } = useLocation()
  return (
    <aside className="sidebar" aria-label="Điều hướng chính">
      <Link className="brand" to={homeForRole(role)} aria-label="Về trang chính">
        <img className="brand-logo" src={logo} alt="Tra cứu kết quả thi" />
      </Link>
      <nav aria-label="Các chức năng">
        {getMenuItems(role).map(({ path, title, icon }) => {
          const active = pathname === path || (path === '/lookup' && /^\/student\/[^/]+$/.test(pathname))
          return <Link key={path} to={path}
            aria-current={active ? 'page' : undefined}
            className={active ? 'active' : undefined}>
            <span className="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d={icons[icon]} /></svg></span>
            <span>{title}</span>
          </Link>
        })}
      </nav>
      <div className="userbox">
        <div><b>{user?.full_name || user?.username}</b><span className="sidebar-note"><Badge value={role} /></span></div>
        <button type="button" onClick={() => logout()}>Đăng xuất</button>
        {import.meta.env.DEV && <Link to="/__components">Kiểm tra component</Link>}
      </div>
    </aside>
  )
}
