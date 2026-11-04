import { Link, useLocation, useParams } from 'react-router-dom'
import { useRouteFilters } from '../../hooks/useRouteFilters.js'
import { ErrorState } from '../../components/feedback/ErrorState.jsx'
import { useStudentTranscript } from './useTranscript.js'
import { TranscriptPanel } from './TranscriptPanel.jsx'

export function StudentTranscriptPage() {
  const { id } = useParams()
  const { state } = useLocation()
  const { filters, apply } = useRouteFilters(['semester_id'])
  const query = useStudentTranscript(id, filters)
  const back = /^\/lookup(?:\?|$)/.test(state?.lookup || '') ? state.lookup : '/lookup'
  return <article className="transcript-page"><Link className="no-print" to={back}>← Quay lại tra cứu</Link><h1>Bảng điểm sinh viên</h1>
    {/^\d+$/.test(id) ? <TranscriptPanel query={query} filters={filters} onApply={apply} /> : <ErrorState message="ID sinh viên không hợp lệ." />}
  </article>
}
