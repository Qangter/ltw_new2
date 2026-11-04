// Explicit test data only. Application modules must never import this file.
export const metaFixture = {
  semesters: [{ id: 1, semester_name: 'Học kỳ 1', semester_code: 'HK1', academic_year: '2025-2026' }, { id: 2, semester_name: 'Học kỳ 2', semester_code: 'HK2', academic_year: '2025-2026' }],
  classes: [{ id: 1, class_code: 'CNTT01', class_name: 'Công nghệ thông tin 01' }],
  subjects: [{ id: 1, subject_code: 'WEB01', subject_name: 'Lập trình Web', credits: 3 }],
}
export const studentFixture = { id: 42, student_code: 'SVTEST42', full_name: 'Sinh viên kiểm thử', class_code: 'CNTT01', major_name: 'Công nghệ thông tin', department_name: 'Khoa CNTT', status: 'ACTIVE', date_of_birth: '2003-01-02', gender: 'MALE', admission_year: 2021 }
export const transcriptGradeFixture = { grade_id: 7, subject_code: 'WEB01', subject_name: 'Lập trình Web', credits: 3, semester_id: 1, semester_name: 'Học kỳ 1', academic_year: '2025-2026', teacher_name: 'Giáo viên kiểm thử', attendance_score: null, midterm_score: 0, final_score: 8.125, total_score: 6.5, letter_grade: 'C+', result: 'PASSED' }
export const transcriptFixture = { student: studentFixture, grades: [transcriptGradeFixture], summary: { gpa: 7.77, subjects: 1, credits: 3, passed_credits: 3, failed_subjects: 0 } }
export const gradeFixture = { ...transcriptGradeFixture, id: 7, student_code: studentFixture.student_code, full_name: studentFixture.full_name, edits: 1 }
export const historyFixture = [{ changed_at: '2026-01-02 09:00:00', old_score: 0, new_score: 6.5, old_result: 'FAILED', new_result: 'PASSED', changed_by: 'Giáo viên kiểm thử', reason: 'Phúc khảo kiểm thử' }]
export const overviewFixture = { students: 100, teachers: 10, subjects: 8, classes: 4, grades: 50, avg_score: 6.25, passed: 40, failed: 10, pass_rate: 80, fail_rate: 20 }
export function readFixture(url) {
  const { pathname, searchParams } = new URL(url, 'http://test.local')
  if (pathname === '/api/meta') return metaFixture
  if (pathname === '/api/students') return { data: [studentFixture], total: 21, page: Number(searchParams.get('page') || 1), limit: 10, pages: 3 }
  if (/^\/api\/students\/[^/]+\/transcript$/.test(pathname)) return transcriptFixture
  if (pathname === '/api/grades') return { data: [gradeFixture], total: 31, page: Number(searchParams.get('page') || 1), limit: 15, pages: 3 }
  if (/^\/api\/grades\/[^/]+\/history$/.test(pathname)) return historyFixture
  if (pathname === '/api/stats/overview') return overviewFixture
  if (pathname === '/api/stats/by-semester') return [{ semester_code: 'HK1', semester_name: 'Học kỳ 1', total: 50, avg_score: 6.25, passed: 40, pass_rate: 80 }]
  if (pathname === '/api/stats/by-subject') return [{ subject_code: 'WEB01', subject_name: 'Lập trình Web', total: 50, avg_score: 6.25, passed: 40, pass_rate: 80 }]
  if (pathname === '/api/stats/distribution') return [{ letter_grade: 'A', total: 40 }, { letter_grade: 'F', total: 10 }]
  if (pathname === '/api/stats/by-department') return [{ department_name: 'Khoa CNTT', students: 100 }]
  return undefined
}
