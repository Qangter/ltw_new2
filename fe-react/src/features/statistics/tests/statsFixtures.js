// Synthetic API fixtures, not evidence from the production database.
// Rates intentionally differ from count-derived values to catch client recomputation.
export const overviewFixture = {
  students: 120, teachers: 12, subjects: 24, classes: 8,
  grades: 10, avg_score: 7.37, passed: 8, failed: 2, pass_rate: 81.23, fail_rate: 18.77,
}
export const statsFixtures = {
  overview: overviewFixture,
  'by-semester': [
    { semester_code: 'HK1-2026', semester_name: 'Học kỳ 1', total: 10, avg_score: 7.37, passed: 8, pass_rate: 82.34 },
    { semester_code: 'HK2-2026', semester_name: 'Học kỳ 2', total: 2, avg_score: 0, passed: 0, pass_rate: 0 },
  ],
  distribution: [{ letter_grade: 'A+', total: '3' }, { letter_grade: 'F', total: '1' }],
  'by-department': [{ department_name: 'Khoa Công nghệ thông tin', students: '90' }, { department_name: 'Khoa Kinh tế', students: '30' }],
  'by-subject': [
    { subject_code: 'WEB101', subject_name: 'Lập trình Web', total: 10, avg_score: 7.37, passed: 8, pass_rate: 83.45 },
    { subject_code: 'ZERO101', subject_name: 'Môn điểm không', total: 1, avg_score: 0, passed: 0, pass_rate: 0 },
  ],
}
export const emptyOverviewFixture = {
  students: 0, teachers: 0, subjects: 0, classes: 0,
  grades: 0, avg_score: null, passed: 0, failed: 0, pass_rate: 0, fail_rate: 0,
}
export function deferredStats() {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}
export function statsResponse(path) {
  const section = path.replace('/api/stats/', '')
  if (!Object.hasOwn(statsFixtures, section)) throw new Error(`Unexpected fixture request: ${path}`)
  return statsFixtures[section]
}
