import { EmptyState } from '../../../components/feedback/EmptyState.jsx'
import { PassRateBar } from './PassRateBar.jsx'

export function SemesterBars({ items }) {
  if (!items?.length) return <EmptyState title="Chưa có dữ liệu học kỳ." />
  return <div>{items.map((item) => <PassRateBar key={item.semester_code} label={item.semester_code} value={item.pass_rate} />)}</div>
}
