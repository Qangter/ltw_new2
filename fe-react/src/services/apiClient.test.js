import { describe, it, expect, vi } from 'vitest'
import { createApiClient } from './apiClient.js'
import { deferred, jsonResponse } from '../test/authFixtures.js'

describe('fetch client (mocked transport)', () => {
  it('encodes query parameters, Bearer token and JSON without losing zero/false', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ ok: true }))
    await createApiClient({ token: 'fixture', fetchImpl })('/api/test', { method: 'POST', body: { zero: 0 }, query: { q: 'a & b', page: 0, active: false, skip: undefined, id: [1, 2] } })
    const [url, options] = fetchImpl.mock.calls[0]
    expect(url).toBe('/api/test?q=a+%26+b&page=0&active=false&id=1&id=2')
    expect(options.headers.get('Authorization')).toBe('Bearer fixture')
    expect(options.headers.get('Content-Type')).toBe('application/json')
    expect(options.body).toBe('{"zero":0}')
  })
  it('sends FormData without a manually assigned Content-Type and returns a blob', async () => {
    const data = new FormData()
    data.append('file', new Blob(['fixture']), 'fixture.txt')
    const blob = new Blob(['download'])
    const fetchImpl = vi.fn(async () => ({ ok: true, blob: async () => blob }))
    expect(await createApiClient({ fetchImpl })('/api/file', { method: 'POST', body: data, responseType: 'blob', headers: { 'Content-Type': 'multipart/form-data' } })).toBe(blob)
    expect(fetchImpl.mock.calls[0][1].body).toBe(data)
    expect(fetchImpl.mock.calls[0][1].headers.has('Content-Type')).toBe(false)
  })
  it.each([401, 403, 500])('keeps status %s and parses JSON errors for blob requests', async (status) => {
    const onUnauthorized = vi.fn()
    const api = createApiClient({ token: 'fixture', onUnauthorized, fetchImpl: async () => jsonResponse({ message: 'Server error' }, status) })
    await expect(api('/api/file', { responseType: 'blob' })).rejects.toMatchObject({ status, message: 'Server error' })
    expect(onUnauthorized).toHaveBeenCalledTimes(status === 401 ? 1 : 0)
  })
  it('does not retry writes or expire a session on a public login 401', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ message: 'Wrong password' }, 401))
    const onUnauthorized = vi.fn()
    await expect(createApiClient({ fetchImpl, onUnauthorized })('/api/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject({ status: 401 })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(onUnauthorized).not.toHaveBeenCalled()
  })
  it('supports external AbortSignal even when transport ignores cancellation', async () => {
    const pending = deferred(), controller = new AbortController()
    const fetchImpl = vi.fn(() => pending.promise)
    const result = createApiClient({ fetchImpl })('/api/test', { signal: controller.signal })
    controller.abort()
    pending.resolve(jsonResponse({ secret: true }))
    await expect(result).rejects.toMatchObject({ name: 'AbortError' })
    expect(fetchImpl.mock.calls[0][1].signal.aborted).toBe(true)
  })
  it('handles network, invalid JSON, no-content and prevents external token leakage', async () => {
    await expect(createApiClient({ fetchImpl: async () => { throw new TypeError('offline') } })('/api/test')).rejects.toMatchObject({ status: 0 })
    await expect(createApiClient({ fetchImpl: async () => new Response('<html>') })('/api/test')).rejects.toMatchObject({ status: 200 })
    expect(await createApiClient({ fetchImpl: async () => new Response(null, { status: 204 }) })('/api/test')).toBeNull()
    const fetchImpl = vi.fn()
    for (const url of ['https://evil.test/api/x', '//evil.test/api/x', '/api/../outside']) await expect(createApiClient({ fetchImpl })(url)).rejects.toThrow()
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
