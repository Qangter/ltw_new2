import { useEffect, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import { useLeaveGuard } from '../../app/LeaveGuardContext.js'
import { ConfirmDialog } from '../../components/overlay/ConfirmDialog.jsx'

export function EntryLeaveGuard({ dirty, busy }) {
  const { register } = useLeaveGuard()
  const [action, setAction] = useState(null)
  const blocker = useBlocker(dirty || busy)
  useEffect(() => register((next) => {
    if (dirty || busy) setAction(() => next)
    else next()
  }), [register, dirty, busy])
  useEffect(() => {
    if (!dirty && !busy) return
    const warn = (event) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, busy])
  const blocked = blocker.state === 'blocked'
  return <ConfirmDialog open={blocked || !!action} title="Rời trang nhập điểm?"
    description={busy ? 'Đang gửi dữ liệu. Hãy chờ hoàn tất rồi quyết định rời trang.' : 'Có bản nháp chưa lưu. Rời trang hoặc đổi lớp/học kỳ sẽ bỏ các thay đổi này.'}
    pending={busy} confirmLabel="Bỏ thay đổi và tiếp tục" danger
    onCancel={() => { setAction(null); if (blocked) blocker.reset() }}
    onConfirm={() => { const next = action; setAction(null); if (blocked) blocker.proceed(); else next?.() }} />
}
