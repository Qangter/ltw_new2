export const listUsers = (api, { q, role, page }, signal) => api('/api/admin/users', { query: { q, role, page }, signal })
export const setUserActive = (api, id, active) => api(`/api/admin/users/${encodeURIComponent(id)}/active`, { method: 'PATCH', body: { is_active: active } })
export const resetUserPassword = (api, id) => api(`/api/admin/users/${encodeURIComponent(id)}/reset-password`, { method: 'POST' })
export const isUserActive = (user) => user.is_active === true || Number(user.is_active) === 1
