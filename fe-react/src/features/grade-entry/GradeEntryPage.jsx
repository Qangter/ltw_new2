import { useState } from 'react'
import { useMeta } from '../../hooks/useMeta.js'
import { useAuth } from '../auth/useAuth.js'
import { useLeaveGuard } from '../../app/LeaveGuardContext.js'
import { QueryState } from '../../components/feedback/QueryState.jsx'
import { EmptyState } from '../../components/feedback/EmptyState.jsx'
import { useOfferings } from './useOfferings.js'
import { OfferingEditor } from './OfferingEditor.jsx'
import './grade-entry.css'

export function GradeEntryPage() {
  const meta = useMeta()
  return <><h1>Nhập điểm</h1><QueryState query={meta}>{(data) => <SemesterSelection semesters={data.semesters} />}</QueryState></>
}

function SemesterSelection({ semesters }) {
  const initial = semesters.find((semester) => semester.status === 'ACTIVE') || semesters.at(-1)
  const [selected, setSelected] = useState(initial)
  const { requestLeave } = useLeaveGuard()
  if (!selected && initial) setSelected(initial)
  if (!selected) return <EmptyState title="Chưa có học kỳ." />
  // Retain the selected context if metadata disappears during a background refresh.
  const choices = semesters.some((item) => item.id === selected.id) ? semesters : [...semesters, selected]
  return <><div className="card"><label htmlFor="entry-semester">Học kỳ</label>
    <select id="entry-semester" value={selected.id} onChange={(event) => { const value = choices.find((item) => String(item.id) === event.target.value); requestLeave(() => setSelected(value)) }}>
      {choices.map((semester) => <option key={semester.id} value={semester.id}>{semester.semester_name}</option>)}
    </select></div><OfferingSelection key={selected.id} semesterId={selected.id} /></>
}

function OfferingSelection({ semesterId }) {
  const query = useOfferings(semesterId)
  return <QueryState query={query}>{(offerings) => <OfferingWorkspace offerings={offerings} />}</QueryState>
}

function OfferingWorkspace({ offerings }) {
  const [selected, setSelected] = useState(offerings[0])
  const { user } = useAuth()
  const { requestLeave } = useLeaveGuard()
  if (!selected && offerings.length) setSelected(offerings[0])
  if (!selected) return <EmptyState title="Không có lớp học phần trong học kỳ này." />
  const offering = offerings.find((item) => item.id === selected.id) || selected
  const choices = offerings.some((item) => item.id === selected.id) ? offerings : [...offerings, selected]
  return <><div className="card"><label htmlFor="entry-offering">Lớp học phần</label>
    <select id="entry-offering" value={offering.id} onChange={(event) => { const value = choices.find((item) => String(item.id) === event.target.value); requestLeave(() => setSelected(value)) }}>
      {choices.map((item) => <option key={item.id} value={item.id}>{item.subject_code} - {item.subject_name} ({item.enrolled} SV){user.role === 'ADMIN' ? ` - ${item.teacher_name}` : ''}</option>)}
    </select></div><OfferingEditor key={offering.id} offering={offering} /></>
}
