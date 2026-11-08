// Test transport only. Never imported by application code.
export const entryMeta = { semesters: [{ id: 1, semester_name: 'Học kỳ 1', status: 'ACTIVE' }, { id: 2, semester_name: 'Học kỳ 2' }], subjects: [], classes: [] }
export const entryOfferings = [
  { id: 11, subject_code: 'WEB01', subject_name: 'Lập trình Web', teacher_name: 'GV kiểm thử', enrolled: 3 },
  { id: 12, subject_code: 'SQL01', subject_name: 'Cơ sở dữ liệu', teacher_name: 'GV khác', enrolled: 0 },
]
export const entryRows = [1, 2, 3].map((id) => ({ enrollment_id: id, student_code: `SV00${id}`, full_name: `Sinh viên ${id}`, grade_id: id === 3 ? 103 : null,
  attendance_score: null, midterm_score: null, final_score: id === 3 ? '5.00' : null, total_score: id === 3 ? '5.00' : null, letter_grade: id === 3 ? 'D' : null, result: id === 3 ? 'PASSED' : null }))
