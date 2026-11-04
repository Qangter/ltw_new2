import { ApiError, abortError, createApiClient } from '../../services/apiClient.js'
import { createQueryClient } from '../../app/queryClient.js'
import { createSessionStorage } from './sessionStorage.js'

export function createAuthSession({ storage = createSessionStorage(), fetchImpl = globalThis.fetch } = {}) {
  const listeners = new Set()
  let generation = 0
  let controller = new AbortController()
  let snapshot = { status: 'verifying', user: null, error: null, sessionId: 0, queryClient: createQueryClient() }
  let currentToken = null
  const publish = (changes) => {
    snapshot = { ...snapshot, ...changes }
    listeners.forEach((listener) => listener())
  }
  function retire() {
    controller.abort()
    void snapshot.queryClient.cancelQueries()
    snapshot.queryClient.clear()
  }
  function rotate(token, status, notice = null) {
    retire()
    currentToken = token
    const sessionId = ++generation
    controller = new AbortController()
    const api = createApiClient({ token, fetchImpl, sessionSignal: controller.signal,
      onUnauthorized: () => { if (generation === sessionId) logout('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.') },
    })
    publish({ sessionId, status, user: null, error: null, notice, api, queryClient: createQueryClient() })
    return snapshot
  }
  function logout(notice = null) {
    const cleared = storage.clear()
    rotate(null, 'anonymous', cleared ? notice : 'Đã đăng xuất trong tab này. Trình duyệt không cho xóa bộ nhớ; hãy xóa dữ liệu trang trước khi dùng chung thiết bị.')
  }
  async function verify(token) {
    const session = rotate(token, 'verifying')
    try {
      const user = await session.api('/api/auth/me')
      if (generation !== session.sessionId) throw abortError()
      if (!user?.id || !['ADMIN', 'TEACHER', 'STUDENT'].includes(user.role)) throw new ApiError('Thông tin tài khoản từ máy chủ không hợp lệ.', 502)
      const saved = storage.save(token, user)
      publish({ status: 'authenticated', user, error: null,
        notice: saved ? null : 'Không lưu được phiên trong trình duyệt. Bạn có thể phải đăng nhập lại khi tải lại trang.' })
    } catch (error) {
      if (generation !== session.sessionId || error.name === 'AbortError') return
      publish({ error })
    }
  }
  async function restore() {
    const token = storage.readToken()
    if (token) await verify(token)
    else logout()
  }
  async function login(credentials) {
    storage.clear()
    const session = rotate(null, 'anonymous')
    const result = await session.api('/api/auth/login', { method: 'POST', body: credentials })
    if (generation !== session.sessionId) throw abortError()
    if (!result?.token || typeof result.token !== 'string') throw new ApiError('Máy chủ không trả về token hợp lệ.', 502)
    storage.save(result.token, null)
    await verify(result.token)
  }
  return {
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    getSnapshot: () => snapshot,
    start: restore,
    stop() { generation++; retire() },
    login, logout,
    retryVerify: () => currentToken ? verify(currentToken) : restore(),
    syncStorage() { if (storage.readToken() !== currentToken) void restore() },
  }
}
