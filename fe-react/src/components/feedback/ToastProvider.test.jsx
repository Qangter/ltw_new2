import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { ToastProvider } from './ToastProvider.jsx'
import { useToast } from '../../hooks/useToast.js'

function Harness() {
  const { notify } = useToast()
  return <>
    <button onClick={() => notify('Đã lưu', { type: 'success', duration: 1000 })}>Thông báo</button>
    <button onClick={() => notify('Không thể lưu', { type: 'error', duration: 0 })}>Lỗi</button>
  </>
}

describe('ToastProvider', () => {
  afterEach(() => vi.useRealTimers())
  it('supports concurrent announcements and manual dismissal', () => {
    render(<ToastProvider><Harness /></ToastProvider>)
    fireEvent.click(screen.getByText('Thông báo', { selector: 'button' }))
    fireEvent.click(screen.getByText('Lỗi', { selector: 'button' }))
    expect(screen.getByRole('status')).toHaveTextContent('Đã lưu')
    expect(screen.getByRole('alert')).toHaveTextContent('Không thể lưu')
    fireEvent.click(screen.getAllByRole('button', { name: 'Đóng thông báo' })[0])
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('pauses expiry on focus and resumes when focus leaves', () => {
    vi.useFakeTimers()
    render(<ToastProvider><Harness /></ToastProvider>)
    fireEvent.click(screen.getByText('Thông báo', { selector: 'button' }))
    const close = screen.getByRole('button', { name: 'Đóng thông báo' })
    fireEvent.focus(close)
    act(() => vi.advanceTimersByTime(2000))
    expect(screen.getByRole('status')).toBeInTheDocument()
    fireEvent.blur(close, { relatedTarget: document.body })
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
