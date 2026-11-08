import { createContext, useContext } from 'react'

export const LeaveGuardContext = createContext(null)
export const useLeaveGuard = () => useContext(LeaveGuardContext)
