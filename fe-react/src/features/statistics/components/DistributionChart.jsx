import { EmptyState } from '../../../components/feedback/EmptyState.jsx'
import { formatNumber } from '../../../utils/format.js'

const gradeColors = ['#2563eb', '#3b82f6', '#14b8a6', '#84cc16', '#facc15', '#f97316', '#dc2626', '#7f1d1d']
const departmentColors = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6']

export function DonutChart({ items, labelKey, valueKey, colors }) {
  // Counts are summed only for the chart total and slice proportions, never for grade business rules.
  const total = (items || []).reduce((sum, item) => sum + Number(item[valueKey] || 0), 0)
  if (!total) return <EmptyState title="Chưa có dữ liệu biểu đồ." />

  const slices = items.reduce((result, item, index) => {
    const value = Number(item[valueKey] || 0)
    const start = result.at(-1)?.end || 0
    result.push({ item, value, start, end: start + value / total * 100, color: colors[index % colors.length] })
    return result
  }, [])
  const background = `conic-gradient(${slices.map(({ color, start, end }) => `${color} ${start.toFixed(2)}% ${end.toFixed(2)}%`).join(',')})`

  return <div className="pie-layout">
    <div className="pie-visual">
      <div className="pie-chart" style={{ background }}>
        <div className="pie-center"><strong>{formatNumber(total)}</strong><span>Tổng</span></div>
      </div>
    </div>
    <div className="pie-legend" role="list" aria-label="Chú giải biểu đồ">
      {slices.map(({ item, value, color }) => <div className="pie-legend-item" role="listitem" key={item[labelKey]}>
        <span className="pie-dot" style={{ background: color }} aria-hidden="true" />
        <span className="pie-label" title={item[labelKey]}>{item[labelKey]}</span>
        <b>{formatNumber(value)} <small>{(value / total * 100).toFixed(1)}%</small></b>
      </div>)}
    </div>
  </div>
}

export function DistributionChart({ items }) {
  return <DonutChart items={items} labelKey="letter_grade" valueKey="total" colors={gradeColors} />
}

// Statistics uses count bars (legacy vStats), unlike the dashboard donut.
export function DistributionBars({ items }) {
  if (!items?.length) return <EmptyState title="Chưa có dữ liệu biểu đồ." />
  const max = Math.max(...items.map((item) => Number(item.total)), 1)
  return <div>{items.map((item) => <div className="bar-row" key={item.letter_grade}>
    <span>{item.letter_grade}</span><div className="bar"><i style={{ width: `${Number(item.total) / max * 100}%` }} /></div><b>{formatNumber(item.total)}</b>
  </div>)}</div>
}

export function DepartmentChart({ items }) {
  return <DonutChart items={items} labelKey="department_name" valueKey="students" colors={departmentColors} />
}
