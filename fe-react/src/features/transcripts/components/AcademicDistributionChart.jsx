import { EmptyState } from '../../../components/feedback/EmptyState.jsx'

const BANDS = [
  { label: 'Giỏi', min: 8, color: '#16865a' },
  { label: 'Khá', min: 6.5, color: '#3b82f6' },
  { label: 'Trung bình', min: 5, color: '#eab308' },
  { label: 'Yếu', min: 3.5, color: '#f97316' },
  { label: 'Kém', min: 0, color: '#ef4444' },
]

export function AcademicDistributionChart({ grades, scale }) {
  const counts = BANDS.map((band) => ({ ...band, count: 0 }))
  const validGrades = grades.filter((grade) => grade.total_score !== null && Number.isFinite(Number(grade.total_score)))

  validGrades.forEach(({ total_score }) => {
    const score = Number(total_score)
    const band = counts.find(({ min }) => score >= min)
    if (band) band.count += 1
  })

  if (!validGrades.length) return <EmptyState title="Chưa có dữ liệu điểm để phân bố." />

  const total = validGrades.length
  let offset = 0
  const stops = counts.map(({ count, color }) => {
    const start = offset
    offset += count / total * 100
    return `${color} ${start}% ${offset}%`
  }).join(', ')

  return <div className="academic-distribution">
    <div className="academic-distribution__visual" role="img" aria-label={`Phân bố ${total} môn học theo nhóm điểm thang ${scale}`}>
      <div className="academic-distribution__donut" style={{ background: `conic-gradient(${stops})` }}>
        <div className="academic-distribution__center"><strong>{total}</strong><span>Môn học</span></div>
      </div>
    </div>
    <ul className="academic-distribution__legend" aria-label="Chú giải phân bố kết quả">
      {counts.map(({ label, count, color }) => <li key={label}>
        <span className="academic-distribution__swatch" style={{ backgroundColor: color }} aria-hidden="true" />
        <span>{label}</span>
        <b>{count}</b>
        <small>{(count / total * 100).toFixed(1)}%</small>
      </li>)}
    </ul>
  </div>
}
