import { useEffect, useState, useSyncExternalStore } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from './AuthContext.js'
import { createAuthSession } from './authSession.js'

export function AuthProvider({ children, session: providedSession }) {
  const [session] = useState(() => providedSession || createAuthSession())
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot)
  useEffect(() => {
    void session.start()
    const onStorage = (event) => {
      if (event.key === 'token' || event.key === null) session.syncStorage()
    }
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener('storage', onStorage); session.stop() }
  }, [session])
  return <AuthContext.Provider value={{ ...snapshot, login: session.login, logout: session.logout, retryVerify: session.retryVerify }}>
    <QueryClientProvider client={snapshot.queryClient}>{children}</QueryClientProvider>
  </AuthContext.Provider>
}
