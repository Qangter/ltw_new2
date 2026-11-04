import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ToastContext } from './ToastContext.js'

function Toast({ id, message, type, duration, dismiss }) {
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused || duration <= 0) return
    const timer = setTimeout(() => dismiss(id), duration)
    return () => clearTimeout(timer)
  }, [id, duration, paused, dismiss])
  return <div className={`toast ${type === 'error' ? 'err' : type === 'success' ? 'ok' : 'info'}`}
    onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
    onFocus={() => setPaused(true)} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false)
    }}>
    <span role={type === 'error' ? 'alert' : 'status'} aria-atomic="true">{message}</span>
    <button type="button" className="toast-close" aria-label="Đóng thông báo" onClick={() => dismiss(id)}>×</button>
  </div>
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const sequence = useRef(0)
  const dismiss = useCallback((id) => setToasts((items) => items.filter((item) => item.id !== id)), [])
  const notify = useCallback((message, { type = 'info', duration = 5000 } = {}) => {
    const id = ++sequence.current
    setToasts((items) => [...items, { id, message, type, duration }])
    return id
  }, [])
  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss])
  return <ToastContext.Provider value={value}>
    {children}
    <div id="toast" aria-label="Thông báo">
      {toasts.map((item) => <Toast key={item.id} {...item} dismiss={dismiss} />)}
    </div>
  </ToastContext.Provider>
}
