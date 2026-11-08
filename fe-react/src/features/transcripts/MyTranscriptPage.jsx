import { useRouteFilters } from '../../hooks/useRouteFilters.js'
import { useMyTranscript } from './useTranscript.js'
import { TranscriptPanel } from './TranscriptPanel.jsx'

export function MyTranscriptPage() {
  const { filters, apply } = useRouteFilters(['semester_id'])
  const query = useMyTranscript(filters)
  return <article className="transcript-page"><h1>Bảng điểm của tôi</h1><TranscriptPanel query={query} filters={filters} onApply={apply} /></article>
}
