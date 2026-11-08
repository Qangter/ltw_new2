import { useMemo, useRef } from 'react'
import { LeaveGuardContext } from './LeaveGuardContext.js'

export function LeaveGuardProvider({ children }) {
  const guard = useRef(null)
  const value = useMemo(() => ({
    register(handler) {
      guard.current = handler
      return () => { if (guard.current === handler) guard.current = null }
    },
    requestLeave(action) { if (guard.current) guard.current(action); else action() },
  }), [])
  return <LeaveGuardContext.Provider value={value}>{children}</LeaveGuardContext.Provider>
}
