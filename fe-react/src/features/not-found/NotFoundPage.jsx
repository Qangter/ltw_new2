import { Link } from 'react-router-dom'
import { EmptyState } from '../../components/feedback/EmptyState.jsx'

export function NotFoundPage() {
  return <>
    <h1>Không tìm thấy trang</h1>
    <EmptyState title="Địa chỉ không hợp lệ." description="Địa chỉ này không thuộc các chức năng hiện có."
      action={<Link to="/dashboard" className="btn">Về tổng quan</Link>} />
  </>
}
