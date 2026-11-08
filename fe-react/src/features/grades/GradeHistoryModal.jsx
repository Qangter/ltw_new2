import { Modal } from '../../components/overlay/Modal.jsx'
import { QueryState } from '../../components/feedback/QueryState.jsx'
import { EmptyState } from '../../components/feedback/EmptyState.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { formatNumber } from '../../utils/format.js'
import { useGradeHistory } from './useGrades.js'

export function GradeHistoryModal({ grade, onClose }) {
  const history = useGradeHistory(grade.id)
  return <Modal open title="Lịch sử sửa điểm" description={`${grade.student_code} · ${grade.full_name} · ${grade.subject_code} - ${grade.subject_name}`} onClose={onClose}>
    <QueryState query={history}>{(rows) => rows.length ? <DataTable label="Lịch sử sửa điểm" className="history-table">
      <thead><tr>{['Thời gian', 'Cũ', 'Mới', 'Người sửa', 'Lý do'].map((name) => <th key={name} scope="col">{name}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={`${row.changed_at}-${index}`}>
        <td>{row.changed_at}</td><td>{formatNumber(row.old_score)}<div><Badge value={row.old_result} /></div></td>
        <td>{formatNumber(row.new_score)}<div><Badge value={row.new_result} /></div></td><td>{row.changed_by || ''}</td><td className="wrap-cell">{row.reason}</td>
      </tr>)}</tbody>
    </DataTable> : <EmptyState title="Chưa có lịch sử chỉnh sửa." />}</QueryState>
    <div className="actions"><button type="button" className="sec" onClick={onClose}>Đóng</button></div>
  </Modal>
}
