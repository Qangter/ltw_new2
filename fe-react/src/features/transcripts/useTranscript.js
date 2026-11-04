import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/useAuth.js'
import { queryKeys } from '../../app/queryKeys.js'
import { getMyTranscript, getStudentTranscript } from './transcriptService.js'

export function useMyTranscript(filters) {
  const { api, sessionId } = useAuth()
  return useQuery({ queryKey: queryKeys.detail(sessionId, 'transcripts', 'me', filters), queryFn: ({ signal }) => getMyTranscript(api, filters, signal) })
}
export function useStudentTranscript(id, filters) {
  const { api, sessionId } = useAuth()
  return useQuery({ queryKey: queryKeys.detail(sessionId, 'transcripts', id, filters), queryFn: ({ signal }) => getStudentTranscript(api, id, filters, signal), enabled: /^\d+$/.test(id) })
}
