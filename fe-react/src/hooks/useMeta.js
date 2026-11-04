import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../features/auth/useAuth.js'
import { queryKeys } from '../app/queryKeys.js'
import { getMeta } from '../services/metaService.js'

export function useMeta() {
  const { api, sessionId } = useAuth()
  return useQuery({ queryKey: queryKeys.resource(sessionId, 'meta'), queryFn: ({ signal }) => getMeta(api, signal) })
}
