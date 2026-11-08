import { useRef, useState } from 'react'
import { Card } from '../../components/ui/Card.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Pagination } from '../../components/ui/Pagination.jsx'
import { EmptyState } from '../../components/feedback/EmptyState.jsx'
import { ErrorState } from '../../components/feedback/ErrorState.jsx'
import { Loading } from '../../components/feedback/Loading.jsx'
import { Modal } from '../../components/overlay/Modal.jsx'
import { ConfirmDialog } from '../../components/overlay/ConfirmDialog.jsx'
import { useToast } from '../../hooks/useToast.js'

const inventory = [
  ['Card', 'Khối nội dung', 'Tiêu đề được liên kết với vùng nội dung.'],
  ['Badge', 'Nhãn trạng thái', 'Nhãn bằng chữ, không chỉ phân biệt qua màu sắc.'],
  ['Pagination', 'Điều hướng trang', 'Trang hiện tại và các nút trước/sau có nhãn.'],
  ['EmptyState', 'Trạng thái rỗng', 'Tách biệt dữ liệu rỗng với trạng thái đang tải.'],
  ['Loading', 'Đang tải', 'Có nhãn cho trình đọc màn hình.'],
  ['Toast', 'Thông báo ngắn', 'Có thể đóng và tạm dừng tự ẩn khi hover/focus.'],
  ['Modal', 'Hộp thoại', 'Focus ban đầu, Tab, Shift+Tab, Escape và trả focus.'],
  ['ConfirmDialog', 'Xác nhận', 'Mặc định focus vào Hủy; parent quản lý kết quả thao tác.'],
]

export default function ComponentPreviewPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [page, setPage] = useState(1)
  const inputRef = useRef(null)
  const { notify } = useToast()
  const size = 3
  return <>
    <h1>Kiểm tra component</h1>
    <p className="preview-note">Chỉ dành cho phát triển. Bảng bên dưới là danh mục component thật, không phải dữ liệu sinh viên hay điểm mẫu.</p>
    <Card title="Hộp thoại và thông báo">
      <div className="preview-actions">
        <button type="button" onClick={() => setModalOpen(true)}>Mở modal</button>
        <button type="button" className="sec" onClick={() => setConfirmOpen(true)}>Mở xác nhận</button>
        <button type="button" className="sec" onClick={() => notify('Thông báo kiểm tra giao diện.', { type: 'success' })}>Thử toast</button>
        <button type="button" className="sec" onClick={() => notify('Thông báo lỗi kiểm tra giao diện.', { type: 'error' })}>Thử toast lỗi</button>
      </div>
      <Badge value="pending" />
    </Card>
    <Card title="Bảng và phân trang">
      <div className="table-wrap" role="region" aria-label="Bảng danh mục component" tabIndex={0}>
        <table className="preview-table">
          <caption>Danh mục thành phần dùng chung — trang {page}</caption>
          <thead><tr><th scope="col">Component</th><th scope="col">Chức năng</th><th scope="col">Hành vi cần kiểm tra</th></tr></thead>
          <tbody>{inventory.slice((page - 1) * size, page * size).map(([name, purpose, behavior]) =>
            <tr key={name}><td>{name}</td><td>{purpose}</td><td>{behavior}</td></tr>)}</tbody>
        </table>
      </div>
      <Pagination page={page} pages={Math.ceil(inventory.length / size)} total={inventory.length} onPageChange={setPage} />
    </Card>
    <div className="grid c2">
      <Card title="Rỗng"><EmptyState /></Card>
      <Card title="Loading ban đầu"><Loading /></Card>
      <Card title="Refetch nền"><p>Nội dung đang hiển thị vẫn được giữ.</p><Loading inline label="Đang cập nhật..." /></Card>
      <Card title="Lỗi"><ErrorState message="Ví dụ trạng thái lỗi; chưa gọi API." onRetry={() => notify('Đã bấm Thử lại (kiểm tra UI).')} /></Card>
    </div>
    <Modal open={modalOpen} title="Kiểm tra bàn phím" description="Thử Tab, Shift+Tab và Escape. Không có dữ liệu nào được gửi."
      onClose={() => setModalOpen(false)} initialFocusRef={inputRef}>
      <label htmlFor="preview-note">Nội dung kiểm tra</label>
      <input id="preview-note" ref={inputRef} />
      <div className="actions"><button type="button" className="sec" onClick={() => setModalOpen(false)}>Đóng modal</button></div>
    </Modal>
    <ConfirmDialog open={confirmOpen} title="Kiểm tra xác nhận" description="Thao tác này chỉ kiểm tra component, không thay đổi dữ liệu."
      onCancel={() => setConfirmOpen(false)} onConfirm={() => {
        setConfirmOpen(false)
        notify('Đã xác nhận kiểm tra giao diện.')
      }} />
  </>
}
