import { EmptyState } from '../../../components/feedback/EmptyState.jsx'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import { formatNumber } from '../../../utils/format.js'
import { PassRateBar } from './PassRateBar.jsx'

export function SubjectTable({ items }) {
  if (!items?.length) return <EmptyState title="Chưa có dữ liệu môn học." />
  return <DataTable label="Thống kê theo môn học">
    <thead><tr>
      <th scope="col">Mã môn</th><th scope="col">Tên môn</th>
      <th scope="col" className="num">Số điểm</th><th scope="col" className="num">Điểm TB</th>
      <th scope="col" className="num">Đạt</th><th scope="col" style={{ width: 220 }}>Tỷ lệ đạt</th>
    </tr></thead>
    <tbody>{items.map((item) => <tr key={item.subject_code}>
      <td>{item.subject_code}</td><td>{item.subject_name}</td>
      <td className="num">{formatNumber(item.total)}</td><td className="num">{formatNumber(item.avg_score)}</td>
      <td className="num">{formatNumber(item.passed)}</td>
      <td><PassRateBar value={item.pass_rate} compact /></td>
    </tr>)}</tbody>
  </DataTable>
}
