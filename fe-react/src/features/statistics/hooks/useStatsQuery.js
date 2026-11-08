import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../../app/queryKeys.js'
import { useAuth } from '../../auth/useAuth.js'
import { fetchStats } from '../services/statsService.js'

export function useStatsQuery(section) {
  const { api, sessionId } = useAuth()
  return useQuery({
    queryKey: queryKeys.detail(sessionId, 'stats', section),
    queryFn: ({ signal }) => fetchStats(api, section, signal),
  })
}
