import { QueryClient } from '@tanstack/react-query'
export function retryRead(failureCount, error) {
  if (error?.name === 'AbortError') return false
  if (error?.status >= 400 && error.status < 500) return false
  return failureCount < 2
}
export function createQueryClient() {
  return new QueryClient({ defaultOptions: {
    queries: { retry: retryRead, staleTime: 30_000 },
    mutations: { retry: false, networkMode: 'always' },
  } })
}
