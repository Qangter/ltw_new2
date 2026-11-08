import { MetadataSelect } from '../../components/ui/MetadataSelect.jsx'
import { QueryState } from '../../components/feedback/QueryState.jsx'
import { useMeta } from '../../hooks/useMeta.js'
import { TranscriptView } from './TranscriptView.jsx'

export function TranscriptPanel({ query, filters, onApply }) {
  const meta = useMeta()
  const semester = meta.data?.semesters.find((item) => String(item.id) === filters.semester_id)
  const scope = filters.semester_id ? semester?.semester_name || `Học kỳ ID ${filters.semester_id}` : 'Tất cả học kỳ'
  return <>
    <div className="no-print"><QueryState query={meta}>{() => null}</QueryState></div>
    <div className="toolbar no-print read-filters">
      <MetadataSelect id="transcript-semester" label="Lọc theo học kỳ" value={filters.semester_id} options={meta.data?.semesters}
        getLabel={(item) => item.semester_name} allLabel="Tất cả học kỳ" disabled={!meta.data}
        onChange={(event) => onApply({ semester_id: event.target.value })} />
      <button type="button" className="sec" onClick={() => window.print()} disabled={!query.data || query.isFetching || query.isError}>In bảng điểm</button>
    </div>
    <QueryState query={query}>{(transcript) => <TranscriptView transcript={transcript} scope={scope} />}</QueryState>
  </>
}
