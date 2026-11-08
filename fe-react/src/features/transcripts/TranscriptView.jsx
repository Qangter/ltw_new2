import { Badge } from '../../components/ui/Badge.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { EmptyState } from '../../components/feedback/EmptyState.jsx'
import { formatDate, formatNumber } from '../../utils/format.js'
import { SemesterGradeTable } from './SemesterGradeTable.jsx'

export function TranscriptView({ transcript, scope }) {
  const { student, summary, grades } = transcript
  const groups = new Map()
  grades.forEach((grade) => {
    if (!groups.has(grade.semester_id)) groups.set(grade.semester_id, { name: grade.semester_name, grades: [] })
    groups.get(grade.semester_id).grades.push(grade)
  })
  const profile = [
    ['Mã sinh viên', student.student_code], ['Lớp', student.class_code], ['Ngành', student.major_name], ['Khoa', student.department_name],
    ['Ngày sinh', formatDate(student.date_of_birth)], ['Giới tính', { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' }[student.gender]], ['Năm nhập học', student.admission_year],
  ]
  const stats = [[formatNumber(summary.gpa), 'Điểm TB (thang 10)'], [summary.subjects, 'Số môn đã có điểm'], [`${summary.passed_credits}/${summary.credits}`, 'Tín chỉ đạt / tổng'], [summary.failed_subjects, 'Môn không đạt']]
  return <div className="transcript-content">
    <Card title={student.full_name}><div className="profile">
      {profile.map(([label, value]) => <div key={label}><span>{label}</span><b>{value ?? '—'}</b></div>)}
      <div><span>Trạng thái</span><Badge value={student.status} /></div>
    </div></Card>
    <p className="transcript-scope">Phạm vi bảng điểm và điểm trung bình: {scope}</p>
    <div className="grid c4 transcript-summary">{stats.map(([value, label]) => <div className="stat" key={label}><div className="n">{value}</div><div className="l">{label}</div></div>)}</div>
    <Card>{grades.length ? [...groups].map(([id, group]) => <SemesterGradeTable key={id} {...group} />) : <EmptyState title="Chưa có dữ liệu điểm." />}</Card>
  </div>
}
