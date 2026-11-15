import { useState } from 'react'
import { useMyTranscript } from './useTranscript.js'
import { QueryState } from '../../components/feedback/QueryState.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { EmptyState } from '../../components/feedback/EmptyState.jsx'
import { MetadataSelect } from '../../components/ui/MetadataSelect.jsx'
import { useRouteFilters } from '../../hooks/useRouteFilters.js'
import { StudentTrendChart } from './components/StudentTrendChart.jsx'
import { AcademicDistributionChart } from './components/AcademicDistributionChart.jsx'
import { SubjectScoreChart } from './components/SubjectScoreChart.jsx'
import './student-statistics.css'

function buildSemesterStats(grades = []) {
  const semesters = new Map()
  grades.forEach((grade) => {
    const key = String(grade.semester_id)
    if (!semesters.has(key)) semesters.set(key, { id: Number(grade.semester_id), name: grade.semester_name, grades: [] })
    semesters.get(key).grades.push(grade)
  })

  return [...semesters.values()]
    .map(({ id, name, grades: semesterGrades }) => {
      const scored = semesterGrades.filter((grade) => Number.isFinite(Number(grade.total_score)) && grade.total_score !== null)
      const credits = scored.reduce((sum, grade) => sum + (Number(grade.credits) || 0), 0)
      const weightedScore = scored.reduce((sum, grade) => sum + Number(grade.total_score) * (Number(grade.credits) || 0), 0)
      const averageScore = scored.length
        ? scored.reduce((sum, grade) => sum + Number(grade.total_score), 0) / scored.length
        : null

      return {
        id,
        name: name || `Học kỳ ${id}`,
        gpa: credits ? weightedScore / credits : averageScore,
        averageScore,
      }
    })
}

function buildSemesterOptions(grades = []) {
  const semesters = new Map()
  grades.forEach((grade) => {
    const key = String(grade.semester_id)
    if (!semesters.has(key)) semesters.set(key, { id: grade.semester_id, semester_name: grade.semester_name })
  })
  return [...semesters.values()]
}

function filterGradesByRange(grades, semesters, fromId, toId) {
  const fromIndex = fromId ? semesters.findIndex((semester) => String(semester.id) === String(fromId)) : 0
  const toIndex = toId ? semesters.findIndex((semester) => String(semester.id) === String(toId)) : semesters.length - 1
  if (fromIndex < 0 || toIndex < 0 || fromIndex > toIndex) return []

  const includedIds = new Set(semesters.slice(fromIndex, toIndex + 1).map((semester) => String(semester.id)))
  return grades.filter((grade) => includedIds.has(String(grade.semester_id)))
}

export function StudentStatisticsPage() {
  const query = useMyTranscript({})
  const [scale, setScale] = useState(10)
  const { filters, apply } = useRouteFilters(['from_semester_id', 'to_semester_id'])

  function changeFromSemester(value, semesters) {
    const nextFromIndex = semesters.findIndex((semester) => String(semester.id) === String(value))
    const toIndex = semesters.findIndex((semester) => String(semester.id) === String(filters.to_semester_id))
    const nextTo = value && filters.to_semester_id && nextFromIndex > toIndex ? value : filters.to_semester_id
    apply({ from_semester_id: value, to_semester_id: nextTo })
  }

  function changeToSemester(value, semesters) {
    const fromIndex = semesters.findIndex((semester) => String(semester.id) === String(filters.from_semester_id))
    const nextToIndex = semesters.findIndex((semester) => String(semester.id) === String(value))
    const nextFrom = value && filters.from_semester_id && nextToIndex < fromIndex ? value : filters.from_semester_id
    apply({ from_semester_id: nextFrom, to_semester_id: value })
  }

  return <article className="student-statistics">
    <header className="student-statistics__header">
      <div>
        <h1>Thống kê học tập</h1>
        <p className="muted">Theo dõi GPA và điểm trung bình của bạn qua từng học kỳ trên thang điểm {scale}.</p>
      </div>
      <div className="student-scale-switch" role="group" aria-label="Chọn hệ điểm">
        {[10, 4].map((value) => <button key={value} type="button" className={scale === value ? 'is-selected' : ''}
          aria-pressed={scale === value} onClick={() => setScale(value)}>Hệ {value}</button>)}
      </div>
    </header>
    <QueryState query={query}>{(transcript) => {
      const semesterOptions = buildSemesterOptions(transcript.grades)
      const grades = filterGradesByRange(transcript.grades, semesterOptions, filters.from_semester_id, filters.to_semester_id)
      const semesters = buildSemesterStats(grades)
      const fromLabel = semesterOptions.find((semester) => String(semester.id) === String(filters.from_semester_id))?.semester_name
      const toLabel = semesterOptions.find((semester) => String(semester.id) === String(filters.to_semester_id))?.semester_name

      return <>
        <div className="toolbar student-statistics__filters" aria-label="Giới hạn học kỳ thống kê">
          <MetadataSelect id="statistics-from-semester" label="Từ học kỳ" value={filters.from_semester_id}
            options={semesterOptions} getLabel={(semester) => semester.semester_name} allLabel="Từ học kỳ đầu tiên"
            disabled={!semesterOptions.length} onChange={(event) => changeFromSemester(event.target.value, semesterOptions)} />
          <MetadataSelect id="statistics-to-semester" label="Đến học kỳ" value={filters.to_semester_id}
            options={semesterOptions} getLabel={(semester) => semester.semester_name} allLabel="Đến học kỳ cuối cùng"
            disabled={!semesterOptions.length} onChange={(event) => changeToSemester(event.target.value, semesterOptions)} />
          <button type="button" className="sec" disabled={!filters.from_semester_id && !filters.to_semester_id}
            onClick={() => apply({ from_semester_id: '', to_semester_id: '' })}>Xóa giới hạn</button>
        </div>
        <p className="student-statistics__range" aria-live="polite">
          Khoảng đang xem: {fromLabel || 'học kỳ đầu tiên'} – {toLabel || 'học kỳ cuối cùng'}
        </p>
        {!semesters.length ? <EmptyState title="Không có dữ liệu điểm trong khoảng học kỳ đã chọn." /> : <div className="student-statistics__charts">
          <Card title="Xu hướng GPA theo học kỳ">
            <p className="student-statistics__description">GPA được tính theo tín chỉ.</p>
            <StudentTrendChart items={semesters} valueKey="gpa" label="GPA" color="#4f46e5" scale={scale} />
          </Card>
          <Card title="Điểm trung bình theo học kỳ">
            <p className="student-statistics__description">So sánh điểm tổng kết trung bình các môn trong từng học kỳ.</p>
            <StudentTrendChart items={semesters} valueKey="averageScore" label="Điểm trung bình" color="#10a77a" type="bar" scale={scale} />
          </Card>
          <Card title="Phân bố kết quả học tập">
            <p className="student-statistics__description">Phân loại kết quả: Giỏi, Khá, Trung bình, Yếu và Kém.</p>
            <AcademicDistributionChart grades={grades} scale={scale} />
          </Card>
          <Card title="Điểm số theo môn học">
            <p className="student-statistics__description">So sánh điểm tổng kết từng môn; môn điểm thấp hiển thị trước.</p>
            <SubjectScoreChart grades={grades} scale={scale} />
          </Card>
        </div>}
      </>
    }}</QueryState>
  </article>
}

export { buildSemesterStats }
