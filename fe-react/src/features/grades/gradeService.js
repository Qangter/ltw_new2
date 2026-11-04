export const listGrades = (api, filters, signal) => api('/api/grades', { query: filters, signal })
export const getGradeHistory = (api, id, signal) => api(`/api/grades/${encodeURIComponent(id)}/history`, { signal })
