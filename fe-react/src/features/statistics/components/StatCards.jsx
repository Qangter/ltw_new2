import { EmptyState } from '../../../components/feedback/EmptyState.jsx'
import { formatNumber } from '../../../utils/format.js'

const metricIcons = {
  people: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  cap: <><path d="m2 10 10-6 10 6-10 6z" /><path d="M6 13v5c3.5 2.7 8.5 2.7 12 0v-5M22 10v6" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z" /><path d="M4 16h16M8 7h8" /></>,
  class: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M9 4v16M15 4v16" /></>,
  grades: <><path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /><path d="M14 3v5h5M8 12h8M8 16h8" /></>,
  trend: <><path d="M4 19V5M4 19h17" /><path d="m7 15 4-4 3 2 6-7" /><path d="M16 6h4v4" /></>,
  pass: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
  fail: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></>,
}

function MetricIcon({ name }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{metricIcons[name]}</svg>
}

export function StatCards({ overview, variant = 'statistics' }) {
  if (!overview) return <EmptyState title="Chưa có số liệu tổng quan." />

  const o = overview
  const dashboard = variant === 'dashboard'
  const cards = dashboard ? [
    [o.students, 'Sinh viên', '', false, 'people'],
    [o.teachers, 'Giáo viên', '', false, 'cap'],
    [o.subjects, 'Môn học', '', false, 'book'],
    [o.classes, 'Lớp', '', false, 'class'],
    [o.grades, 'Bản ghi điểm', 'warn', false, 'grades'],
    [o.avg_score, 'Điểm trung bình', 'warn', false, 'trend'],
    [o.pass_rate, `Tỷ lệ đạt (${formatNumber(o.passed)})`, 'ok', true, 'pass'],
    [o.fail_rate, `Tỷ lệ rớt (${formatNumber(o.failed)})`, 'bad', true, 'fail'],
  ] : [
    [o.pass_rate, `Tỷ lệ đạt (${formatNumber(o.passed)} điểm)`, 'ok', true],
    [o.fail_rate, `Tỷ lệ rớt (${formatNumber(o.failed)} điểm)`, 'bad', true],
    [o.avg_score, 'Điểm trung bình'], [o.grades, 'Tổng bản ghi điểm', 'warn'],
  ]

  return <div className={`grid c4${dashboard ? ' dashboard-stat-grid' : ''}`}>
    {cards.map(([value, label, tone = '', percent, icon]) => <div className={`stat ${tone}${dashboard ? ' dashboard-stat' : ''}`} key={label}>
      {dashboard && <span className="dashboard-stat-icon"><MetricIcon name={icon} /></span>}
      <div className="n">{formatNumber(value)}{percent && value != null ? '%' : ''}</div>
      <div className="l">{label}</div>
    </div>)}
  </div>
}
