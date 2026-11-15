const WIDTH = 760
const HEIGHT = 300
const MARGIN = { top: 18, right: 22, bottom: 62, left: 48 }
function xAt(index, count) {
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right
  const categoryWidth = plotWidth / Math.max(count, 1)
  return MARGIN.left + categoryWidth * (index + 0.5)
}

function yAt(value, scale) {
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom
  return MARGIN.top + ((scale - value) / scale) * plotHeight
}

function displayValue(value, scale) {
  return value === null ? null : Number(value) * scale / 10
}

function semesterLines(name) {
  const academicYear = name.match(/^(.*?)\s+(năm học)\s+(.+)$/i)
  if (academicYear) return [academicYear[1], `${academicYear[2]} ${academicYear[3]}`]

  const words = name.split(/\s+/)
  const lines = []
  let line = ''
  words.forEach((word) => {
    if (line && `${line} ${word}`.length > 16) {
      lines.push(line)
      line = word
    } else line = line ? `${line} ${word}` : word
  })
  if (line) lines.push(line)
  return lines
}

export function StudentTrendChart({ items, valueKey, label, color, type = 'line', scale = 10 }) {
  const count = items.length
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom
  const barWidth = Math.min(46, plotWidth / Math.max(count, 1) * 0.5)
  const points = items.map((item, index) => {
    const value = displayValue(item[valueKey], scale)
    return { ...item, value, x: xAt(index, count), y: yAt(value ?? 0, scale), labelLines: semesterLines(item.name) }
  })
  const validPoints = points.filter((point) => point.value !== null)
  const linePath = validPoints.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')
  const ticks = scale === 4 ? [0, 1, 2, 3, 4] : [0, 2, 4, 6, 8, 10]

  return <div className="student-chart-wrap">
    <svg className="student-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`${label} theo học kỳ, thang điểm 0 đến ${scale}`}>
      {ticks.map((tick) => {
        const y = yAt(tick, scale)
        return <g key={tick}>
          <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y} y2={y} className="student-chart__grid" />
          <text x={MARGIN.left - 10} y={y + 4} textAnchor="end" className="student-chart__tick">{tick}</text>
        </g>
      })}
      <text transform={`translate(15 ${MARGIN.top + plotHeight / 2}) rotate(-90)`} textAnchor="middle" className="student-chart__axis-title">{label} (thang {scale})</text>
      {type === 'line' && points.length > 1 && <path d={linePath} pathLength="1" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
      {points.map((point) => <g key={point.id}>
        {point.value === null ? <circle cx={point.x} cy={yAt(0, scale)} r="5" fill="#fff" stroke="#94a3b8" strokeWidth="2" /> : type === 'bar' ? <rect x={point.x - barWidth / 2} y={point.y} width={barWidth} height={MARGIN.top + plotHeight - point.y} rx="5" fill={color} opacity=".88" /> : <circle cx={point.x} cy={point.y} r="5" fill="#fff" stroke={color} strokeWidth="3" />}
        <text x={point.x} y={point.value === null ? yAt(0, scale) - 10 : point.y - 10} textAnchor="middle" className="student-chart__value">{point.value === null ? '—' : point.value.toFixed(2)}</text>
        <text x={point.x} y={HEIGHT - MARGIN.bottom + 14} textAnchor="middle" className="student-chart__semester">
          {point.labelLines.map((line, lineIndex) => <tspan key={lineIndex} x={point.x} dy={lineIndex ? 12 : 0}>{line}</tspan>)}
        </text>
      </g>)}
      <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={MARGIN.top + plotHeight} y2={MARGIN.top + plotHeight} className="student-chart__axis" />
    </svg>
  </div>
}
