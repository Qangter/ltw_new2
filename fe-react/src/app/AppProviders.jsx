import { ToastProvider } from '../components/feedback/ToastProvider.jsx'
import { AuthProvider } from '../features/auth/AuthProvider.jsx'
import { useAuth } from '../features/auth/useAuth.js'

function SessionUI({ children }) {
  const { sessionId, status } = useAuth()
  // Retire private forms/toasts on identity transitions; keep login form mounted.
  return <ToastProvider key={status === 'anonymous' ? 'anonymous' : sessionId}>{children}</ToastProvider>
}

export function AppProviders({ children, session }) {
  return <AuthProvider session={session}><SessionUI>{children}</SessionUI></AuthProvider>
}
