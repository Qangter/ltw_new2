import { DataTable } from '../../components/ui/DataTable.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { formatNumber } from '../../utils/format.js'

export function SemesterGradeTable({ name, grades }) {
  return <section className="semester-group"><h2>{name}</h2><DataTable label={`Điểm ${name}`} className="transcript-table">
    <colgroup>{[7, 23, 5, 16, 6, 6, 6, 8, 7, 16].map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup>
    <thead><tr>{['Mã môn', 'Tên môn', 'Tín chỉ', 'Giáo viên', 'CC', 'GK', 'CK', 'Tổng kết', 'Xếp loại', 'Kết quả'].map((text) => <th key={text} scope="col">{text}</th>)}</tr></thead>
    <tbody>{grades.map((grade) => <tr key={grade.grade_id}>
      <td>{grade.subject_code}</td><td>{grade.subject_name}</td><td className="num">{grade.credits}</td><td>{grade.teacher_name}</td>
      {['attendance_score', 'midterm_score', 'final_score', 'total_score'].map((key) => <td className="num" key={key}>{key === 'total_score' ? <b>{formatNumber(grade[key])}</b> : formatNumber(grade[key])}</td>)}
      <td><b>{grade.letter_grade}</b></td><td><Badge value={grade.result} /></td>
    </tr>)}</tbody>
  </DataTable></section>
}
