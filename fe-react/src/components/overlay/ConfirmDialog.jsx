import { useRef } from 'react'
import { Modal } from './Modal.jsx'

// Parent owns the mutation and error. Do not close automatically on confirmation.
export function ConfirmDialog({ open, title = 'Xác nhận thao tác', description, onCancel, onConfirm, pending = false, error, confirmLabel = 'Xác nhận', danger = false }) {
  const cancelRef = useRef(null)
  return <Modal open={open} title={title} description={description} onClose={onCancel}
    initialFocusRef={cancelRef} dismissible={!pending}>
    {error && <p role="alert" className="form-error">{error}</p>}
    <div className="actions">
      <button type="button" className="sec" ref={cancelRef} disabled={pending} onClick={onCancel}>Hủy</button>
      <button type="button" className={danger ? 'danger' : undefined} disabled={pending} onClick={onConfirm}>
        {pending ? 'Đang xử lý...' : confirmLabel}
      </button>
    </div>
  </Modal>
}
