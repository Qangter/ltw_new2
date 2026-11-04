import { useContext } from 'react'
import { ToastContext } from '../components/feedback/ToastContext.js'

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast phải được dùng trong ToastProvider')
  return context
}
