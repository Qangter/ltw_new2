export const gradeResources = ['offering-students', 'grades', 'transcripts', 'grade-history', 'stats']
export const getOfferings = (api, semesterId, signal) => api('/api/offerings', { query: { semester_id: semesterId }, signal })
export const getOfferingStudents = (api, id, signal) => api(`/api/offerings/${encodeURIComponent(id)}/students`, { signal })
export const saveGrade = (api, enrollmentId, body) => api(`/api/grades/enrollment/${encodeURIComponent(enrollmentId)}`, { method: 'PUT', body: { ...body, reason: 'Cập nhật điểm thủ công' } })
export const deleteGrade = (api, id) => api(`/api/grades/${encodeURIComponent(id)}`, { method: 'DELETE' })
export const enrollStudent = (api, id, code) => api(`/api/offerings/${encodeURIComponent(id)}/enroll`, { method: 'POST', body: { student_code: code.trim() } })
