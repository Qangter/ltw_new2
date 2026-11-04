import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../../auth/AuthContext.js'
import { queryKeys } from '../../../app/queryKeys.js'
import { useStatsQuery } from '../hooks/useStatsQuery.js'
import { fetchStats } from '../services/statsService.js'
import { deferredStats, statsFixtures, statsResponse } from './statsFixtures.js'

function setup(api = vi.fn(async (path) => statsResponse(path))) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
  const auth = { api, sessionId: 'fixture-session-one' }
  const wrapper = ({ children }) => <AuthContext.Provider value={{ ...auth }}>
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  </AuthContext.Provider>
  return { api, client, auth, wrapper }
}

describe('statistics section queries with explicit API fixtures', () => {
  it.each(Object.keys(statsFixtures))('loads %s through the session API and central query key', async (section) => {
    const { api, client, auth, wrapper } = setup()
    const { result, unmount } = renderHook(() => useStatsQuery(section), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api).toHaveBeenCalledExactlyOnceWith(`/api/stats/${section}`, { signal: expect.any(AbortSignal) })
    expect(result.current.data).toEqual(statsFixtures[section])
    expect(client.getQueryData(queryKeys.detail(auth.sessionId, 'stats', section))).toEqual(statsFixtures[section])
    unmount()
    client.clear()
  })

  it('shares an endpoint cache across consumers and keeps sections independent', async () => {
    const { api, client, wrapper } = setup()
    const { result, unmount } = renderHook(() => ({
      dashboard: useStatsQuery('overview'), stats: useStatsQuery('overview'), semesters: useStatsQuery('by-semester'),
    }), { wrapper })
    await waitFor(() => expect(result.current.semesters.isSuccess).toBe(true))
    expect(api).toHaveBeenCalledTimes(2)
    expect(result.current.dashboard.data).toBe(result.current.stats.data)
    unmount()
    client.clear()
  })

  it('does not show data from a previous session while a new request is pending', async () => {
    const { auth, client, wrapper } = setup()
    const { result, rerender, unmount } = renderHook(() => useStatsQuery('overview'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const pending = deferredStats()
    auth.sessionId = 'fixture-session-two'
    auth.api = vi.fn(() => pending.promise)
    rerender()
    expect(result.current.isPending).toBe(true)
    expect(result.current.data).toBeUndefined()
    await act(async () => pending.resolve({ ...statsFixtures.overview, students: 2 }))
    await waitFor(() => expect(result.current.data.students).toBe(2))
    unmount()
    client.clear()
  })

  it('passes query cancellation to the API when a section unmounts', () => {
    const pending = deferredStats()
    const { api, client, wrapper } = setup(vi.fn(() => pending.promise))
    const { unmount } = renderHook(() => useStatsQuery('distribution'), { wrapper })
    const signal = api.mock.calls[0][1].signal
    expect(signal.aborted).toBe(false)
    unmount()
    expect(signal.aborted).toBe(true)
    client.clear()
  })

  it('rejects unsupported sections without making a request', () => {
    const api = vi.fn()
    expect(() => fetchStats(api, 'unknown')).toThrow('Nhóm thống kê không hợp lệ.')
    expect(api).not.toHaveBeenCalled()
  })
})
