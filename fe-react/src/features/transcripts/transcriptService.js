export const getMyTranscript = (api, filters, signal) => api('/api/students/me/transcript', { query: filters, signal })
export const getStudentTranscript = (api, id, filters, signal) => api(`/api/students/${encodeURIComponent(id)}/transcript`, { query: filters, signal })
