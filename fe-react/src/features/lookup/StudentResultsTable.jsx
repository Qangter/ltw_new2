import { Link, useLocation } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'

export function StudentResultsTable({ students }) {
  const location = useLocation()
  return <DataTable label="Kết quả tra cứu sinh viên"><thead><tr>
    {['Mã SV', 'Họ tên', 'Lớp', 'Ngành', 'Khoa', 'Trạng thái', 'Thao tác'].map((label) => <th key={label} scope="col">{label}</th>)}
  </tr></thead><tbody>{students.map((student) => <tr key={student.id}>
    <td>{student.student_code}</td><td>{student.full_name}</td><td>{student.class_code}</td><td>{student.major_name}</td><td>{student.department_name}</td>
    <td><Badge value={student.status} /></td>
    <td><Link className="btn sm" to={`/student/${student.id}`} state={{ lookup: location.pathname + location.search }} aria-label={`Xem điểm ${student.student_code}`}>Xem điểm</Link></td>
  </tr>)}</tbody></DataTable>
}
