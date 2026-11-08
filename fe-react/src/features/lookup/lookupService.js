export const listStudents = (api, filters, signal) => api('/api/students', { query: filters, signal })
