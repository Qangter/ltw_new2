import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/useAuth.js'
import { queryKeys } from '../../app/queryKeys.js'
import { getGradeHistory, listGrades } from './gradeService.js'

export function useGrades(filters) {
  const { api, sessionId } = useAuth()
  return useQuery({ queryKey: queryKeys.list(sessionId, 'grades', filters), queryFn: ({ signal }) => listGrades(api, filters, signal) })
}
export function useGradeHistory(id) {
  const { api, sessionId } = useAuth()
  return useQuery({ queryKey: queryKeys.detail(sessionId, 'grade-history', id), queryFn: ({ signal }) => getGradeHistory(api, id, signal) })
}
