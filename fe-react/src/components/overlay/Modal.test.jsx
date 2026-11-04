import { StrictMode, useRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal.jsx'
import { ConfirmDialog } from './ConfirmDialog.jsx'

function Harness() {
  const [open, setOpen] = useState(false)
  const input = useRef(null)
  return <>
    <button onClick={() => setOpen(true)}>Mở</button>
    <Modal open={open} title="Form kiểm tra" description="Không gửi dữ liệu" initialFocusRef={input} onClose={() => setOpen(false)}>
      <label htmlFor="note">Ghi chú</label><input id="note" ref={input} />
    </Modal>
  </>
}

describe('Modal lifecycle (native keyboard behavior tested by Playwright)', () => {
  it('labels the modal, sets initial focus and restores the trigger in StrictMode', async () => {
    const user = userEvent.setup()
    render(<StrictMode><Harness /></StrictMode>)
    const trigger = screen.getByRole('button', { name: 'Mở' })
    await user.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Form kiểm tra' })
    expect(dialog).toHaveAccessibleDescription('Không gửi dữ liệu')
    expect(screen.getByLabelText('Ghi chú')).toHaveFocus()
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent(dialog, new Event('cancel', { cancelable: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    expect(document.body.style.overflow).toBe('')
  })

  it('cleans up body scroll on unmount', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Mở' }))
    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('confirm starts on cancel, stays open on error and blocks duplicate actions while pending', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    const onConfirm = vi.fn()
    const props = { open: true, onCancel, onConfirm, title: 'Xác nhận kiểm tra' }
    const { rerender } = render(<ConfirmDialog {...props} />)
    expect(screen.getByRole('button', { name: 'Hủy' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Xác nhận', exact: true }))
    expect(onConfirm).toHaveBeenCalledOnce()
    rerender(<ConfirmDialog {...props} error="Không thể lưu" pending />)
    expect(screen.getByRole('alert')).toHaveTextContent('Không thể lưu')
    expect(screen.getByRole('button', { name: 'Đang xử lý...' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Hủy' }))
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    expect(onCancel).not.toHaveBeenCalled()
    expect(onConfirm).toHaveBeenCalledOnce()
  })
})
