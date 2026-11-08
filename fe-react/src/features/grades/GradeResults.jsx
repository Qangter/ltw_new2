import { useState } from 'react'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Pagination } from '../../components/ui/Pagination.jsx'
import { QueryState } from '../../components/feedback/QueryState.jsx'
import { EmptyState } from '../../components/feedback/EmptyState.jsx'
import { formatNumber } from '../../utils/format.js'
import { GradeHistoryModal } from './GradeHistoryModal.jsx'

export function GradeResults({ query, onPageChange }) {
  const [selected, setSelected] = useState(null)
  return <><QueryState query={query}>{(page) => <>
    {page.data.length ? <DataTable label="Danh sách điểm"><thead><tr>
      {['Mã SV', 'Họ tên', 'Môn học', 'Học kỳ', 'Giáo viên', 'Điểm', 'Loại', 'Kết quả', 'Sửa'].map((name) => <th key={name} scope="col">{name}</th>)}
    </tr></thead><tbody>{page.data.map((grade) => <tr key={grade.id}>
      <td>{grade.student_code}</td><td>{grade.full_name}</td><td>{grade.subject_code} - {grade.subject_name}</td><td>{grade.semester_name}</td><td>{grade.teacher_name}</td>
      <td className="num"><b>{formatNumber(grade.total_score)}</b></td><td>{grade.letter_grade}</td><td><Badge value={grade.result} /></td>
      <td>{Number(grade.edits) > 0 ? <button type="button" className="sm sec" aria-label={`Lịch sử ${grade.student_code} ${grade.subject_code}`} onClick={() => setSelected(grade)}>{grade.edits} lần</button> : '—'}</td>
    </tr>)}</tbody></DataTable> : <EmptyState title="Không có dữ liệu điểm phù hợp." />}
    <Pagination {...page} onPageChange={onPageChange} />
    {page.page > Math.max(1, page.pages) && <button type="button" onClick={() => onPageChange(1)}>Về trang đầu</button>}
  </>}</QueryState>
    {selected && <GradeHistoryModal key={selected.id} grade={selected} onClose={() => setSelected(null)} />}
  </>
}
