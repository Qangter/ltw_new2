export const studentResources = ['students', 'users', 'transcripts', 'stats', 'grades', 'grade-history', 'offering-students']

// Account creation/deletion belongs to the backend's existing student transaction.
export const createStudent = (api, body) => api('/api/students', { method: 'POST', body })
export const updateStudent = (api, id, body) => api(`/api/students/${encodeURIComponent(id)}`, { method: 'PUT', body })
export const deleteStudent = (api, id) => api(`/api/students/${encodeURIComponent(id)}`, { method: 'DELETE' })
