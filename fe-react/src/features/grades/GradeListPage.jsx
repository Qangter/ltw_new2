import { Card } from '../../components/ui/Card.jsx'
import { QueryState } from '../../components/feedback/QueryState.jsx'
import { useMeta } from '../../hooks/useMeta.js'
import { useRouteFilters } from '../../hooks/useRouteFilters.js'
import { GradeFilters } from './GradeFilters.jsx'
import { GradeResults } from './GradeResults.jsx'
import { useGrades } from './useGrades.js'

export function GradeListPage() {
  const { filters: rawFilters, apply, setPage, formKey } = useRouteFilters(['q', 'semester_id', 'subject_id', 'result'], 15)
  const filters = { ...rawFilters, result: ['PASSED', 'FAILED'].includes(rawFilters.result) ? rawFilters.result : '' }
  const meta = useMeta()
  const grades = useGrades(filters)
  return <><h1>Danh sách điểm</h1><Card>
    <QueryState query={meta}>{() => null}</QueryState>
    <GradeFilters key={formKey} filters={filters} meta={meta.data} onApply={apply} />
    <GradeResults key={formKey} query={grades} onPageChange={setPage} />
  </Card></>
}
