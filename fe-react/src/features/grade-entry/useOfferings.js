import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/useAuth.js'
import { queryKeys } from '../../app/queryKeys.js'
import { getOfferings, getOfferingStudents } from './entryService.js'

export function useOfferings(semesterId) {
  const { api, sessionId } = useAuth()
  return useQuery({ queryKey: queryKeys.list(sessionId, 'offerings', { semester_id: semesterId }), queryFn: ({ signal }) => getOfferings(api, semesterId, signal), enabled: !!semesterId })
}
export function useOfferingStudents(id) {
  const { api, sessionId } = useAuth()
  return useQuery({ queryKey: queryKeys.detail(sessionId, 'offering-students', id), queryFn: ({ signal }) => getOfferingStudents(api, id, signal), enabled: !!id })
}
