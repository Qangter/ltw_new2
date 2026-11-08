import { EmptyState } from '../../../components/feedback/EmptyState.jsx'
import { formatNumber } from '../../../utils/format.js'

export function StatCards({ overview, variant = 'statistics' }) {
  if (!overview) return <EmptyState title="Chưa có số liệu tổng quan." />

  const o = overview
  const cards = variant === 'dashboard' ? [
    [o.students, 'Sinh viên'], [o.teachers, 'Giáo viên'],
    [o.subjects, 'Môn học'], [o.classes, 'Lớp'],
    [o.grades, 'Bản ghi điểm', 'warn'], [o.avg_score, 'Điểm trung bình', 'warn'],
    [o.pass_rate, `Tỷ lệ đạt (${formatNumber(o.passed)})`, 'ok', true],
    [o.fail_rate, `Tỷ lệ rớt (${formatNumber(o.failed)})`, 'bad', true],
  ] : [
    [o.pass_rate, `Tỷ lệ đạt (${formatNumber(o.passed)} điểm)`, 'ok', true],
    [o.fail_rate, `Tỷ lệ rớt (${formatNumber(o.failed)} điểm)`, 'bad', true],
    [o.avg_score, 'Điểm trung bình'], [o.grades, 'Tổng bản ghi điểm', 'warn'],
  ]

  return <div className="grid c4">
    {cards.map(([value, label, tone = '', percent]) => <div className={`stat ${tone}`} key={label}>
      <div className="n">{formatNumber(value)}{percent && value != null ? '%' : ''}</div>
      <div className="l">{label}</div>
    </div>)}
  </div>
}
