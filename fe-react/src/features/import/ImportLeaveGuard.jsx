import { useEffect, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import { useLeaveGuard } from '../../app/LeaveGuardContext.js'
import { Modal } from '../../components/overlay/Modal.jsx'

// Keep the result screen alive. Leaving does not cancel server-side commits.
export function ImportLeaveGuard({ pending }) {
  const { register } = useLeaveGuard()
  const [attempted, setAttempted] = useState(false)
  const blocker = useBlocker(pending)
  useEffect(() => register((next) => {
    if (pending) setAttempted(true)
    else next()
  }), [pending, register])
  const blocked = blocker.state === 'blocked'
  const close = () => { setAttempted(false); if (blocked) blocker.reset() }
  return <Modal open={attempted || blocked} title="Chờ kết quả import" onClose={close}
    description={pending
      ? 'File đang được xử lý. Hãy chờ kết quả trước khi chuyển trang hoặc đăng xuất. Rời trang không hủy các dòng máy chủ đã lưu.'
      : 'Yêu cầu đã kết thúc. Đóng hộp thoại để xem kết quả trước khi tiếp tục.'}>
    <button type="button" onClick={close}>Ở lại xem kết quả</button>
  </Modal>
}
