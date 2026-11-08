import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/useAuth.js'
import { queryKeys } from '../../app/queryKeys.js'
import { listStudents } from './lookupService.js'

export function useStudents(filters) {
  const { api, sessionId } = useAuth()
  return useQuery({ queryKey: queryKeys.list(sessionId, 'students', filters), queryFn: ({ signal }) => listStudents(api, filters, signal) })
}
