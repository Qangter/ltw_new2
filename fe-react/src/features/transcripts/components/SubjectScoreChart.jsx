import { EmptyState } from '../../../components/feedback/EmptyState.jsx'

const WIDTH = 800
const MARGIN = { top: 16, right: 70, bottom: 44, left: 230 }
const ROW_HEIGHT = 40

function formatScore(score) {
  return Number(score).toFixed(2).replace(/\.00$/, '')
}

export function SubjectScoreChart({ grades, scale }) {
  const items = grades
    .filter((grade) => grade.total_score !== null && Number.isFinite(Number(grade.total_score)))
    .map((grade) => ({
      ...grade,
      score: Number(grade.total_score) * scale / 10,
      label: grade.semester_name ? `${grade.subject_name} · ${grade.semester_name}` : grade.subject_name,
    }))
    .sort((a, b) => a.score - b.score || a.subject_name.localeCompare(b.subject_name, 'vi'))

  if (!items.length) return <EmptyState title="Chưa có dữ liệu điểm theo môn học." />

  const plotWidth = WIDTH - MARGIN.left - MARGIN.right
  const plotBottom = MARGIN.top + items.length * ROW_HEIGHT
  const height = plotBottom + MARGIN.bottom
  const ticks = scale === 4 ? [0, 1, 2, 3, 4] : [0, 2, 4, 6, 8, 10]

  return <div className="subject-score-chart-wrap">
    <svg className="subject-score-chart" viewBox={`0 0 ${WIDTH} ${height}`} role="img"
      aria-label={`Điểm tổng kết các môn học, thang điểm từ 0 đến ${scale}`}>
      {ticks.map((tick) => {
        const x = MARGIN.left + tick / scale * plotWidth
        return <g key={tick}>
          <line x1={x} x2={x} y1={MARGIN.top} y2={plotBottom} className="subject-score-chart__grid" />
          <text x={x} y={plotBottom + 18} textAnchor="middle" className="subject-score-chart__tick">{tick}</text>
        </g>
      })}
      {items.map((item, index) => {
        const y = MARGIN.top + index * ROW_HEIGHT + 7
        const barWidth = item.score / scale * plotWidth
        const label = item.label.length > 32 ? `${item.label.slice(0, 31)}…` : item.label
        return <g key={`${item.grade_id}-${item.semester_id}`}>
          <title>{`${item.label}: ${formatScore(item.score)}/${scale}`}</title>
          <text x={MARGIN.left - 12} y={y + 16} textAnchor="end" className="subject-score-chart__subject">{label}</text>
          <rect x={MARGIN.left} y={y} width={barWidth} height="22" rx="5" className="subject-score-chart__bar" />
          <text x={WIDTH - MARGIN.right + 10} y={y + 16} className="subject-score-chart__value">{formatScore(item.score)}</text>
        </g>
      })}
      <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={plotBottom} y2={plotBottom} className="subject-score-chart__axis" />
      <text x={MARGIN.left + plotWidth / 2} y={height - 5} textAnchor="middle" className="subject-score-chart__axis-title">Điểm tổng kết (thang {scale})</text>
    </svg>
  </div>
}
