export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}
export const abortError = () => new DOMException('Yêu cầu đã bị hủy.', 'AbortError')

// Each client belongs to ONE session; never read a newer token mid-request.
export function createApiClient({ token = null, sessionSignal, onUnauthorized = () => {}, fetchImpl = globalThis.fetch } = {}) {
  return async function api(path, { method = 'GET', body, query, signal, responseType = 'json', headers: extraHeaders } = {}) {
    if (!path.startsWith('/api/') || path.includes('\\') || path.includes('#')) throw new Error('API phải dùng đường dẫn /api/ cùng origin.')
    const url = new URL(path, 'http://api.local')
    if (!url.pathname.startsWith('/api/')) throw new Error('Đường dẫn API không hợp lệ.')
    for (const [key, value] of Object.entries(query || {})) {
      if (value === undefined || value === null) continue
      url.searchParams.delete(key)
      for (const item of Array.isArray(value) ? value : [value]) url.searchParams.append(key, String(item))
    }
    const controller = new AbortController()
    const signals = [signal, sessionSignal].filter(Boolean)
    const abort = () => controller.abort()
    signals.forEach((item) => item.addEventListener('abort', abort, { once: true }))
    const assertActive = () => {
      if (controller.signal.aborted || signals.some((item) => item.aborted)) throw abortError()
    }
    try {
      assertActive()
      const headers = new Headers(extraHeaders)
      headers.set('Accept', responseType === 'blob' ? '*/*' : 'application/json')
      if (token) headers.set('Authorization', `Bearer ${token}`)
      if (body instanceof FormData) headers.delete('Content-Type')
      else if (body !== undefined) {
        headers.set('Content-Type', 'application/json')
        body = JSON.stringify(body)
      }
      const response = await fetchImpl(`${url.pathname}${url.search}`, { method, headers, body, signal: controller.signal })
      assertActive()
      let data = null
      if (response.ok && responseType === 'blob') data = await response.blob()
      else if (response.status !== 204) {
        const text = await response.text()
        try { data = text ? JSON.parse(text) : null } catch {
          if (response.ok) throw new ApiError('Máy chủ trả về dữ liệu không hợp lệ.', response.status)
        }
      }
      assertActive()
      if (!response.ok) {
        const error = new ApiError(data?.message || (response.status === 403 ? 'Bạn không có quyền thực hiện thao tác này.' : `Yêu cầu thất bại (HTTP ${response.status}).`), response.status, data)
        if (response.status === 401 && token) onUnauthorized(error)
        throw error
      }
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      assertActive()
      if (error.name === 'AbortError') throw error
      throw new ApiError('Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.')
    } finally {
      signals.forEach((item) => item.removeEventListener('abort', abort))
    }
  }
}
