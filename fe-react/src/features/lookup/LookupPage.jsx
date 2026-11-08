import { Card } from '../../components/ui/Card.jsx'
import { Pagination } from '../../components/ui/Pagination.jsx'
import { QueryState } from '../../components/feedback/QueryState.jsx'
import { EmptyState } from '../../components/feedback/EmptyState.jsx'
import { useMeta } from '../../hooks/useMeta.js'
import { useRouteFilters } from '../../hooks/useRouteFilters.js'
import { useStudents } from './useStudents.js'
import { StudentSearchForm } from './StudentSearchForm.jsx'
import { StudentResultsTable } from './StudentResultsTable.jsx'

export function LookupPage() {
  const { filters, apply, setPage, formKey } = useRouteFilters(['q', 'class_id'], 10)
  const meta = useMeta()
  const students = useStudents(filters)
  return <><h1>Tra cứu sinh viên</h1><p className="muted">Tìm theo mã số hoặc họ tên, sau đó xem bảng điểm chi tiết.</p>
    <Card>
      <QueryState query={meta}>{() => null}</QueryState>
      <StudentSearchForm key={formKey} filters={filters} meta={meta.data} onApply={apply} />
      <QueryState query={students}>{(page) => <>
        {page.data.length ? <StudentResultsTable students={page.data} /> : <EmptyState title="Không tìm thấy sinh viên phù hợp." />}
        <Pagination {...page} onPageChange={setPage} />
        {page.page > Math.max(1, page.pages) && <button type="button" onClick={() => setPage(1)}>Về trang đầu</button>}
      </>}</QueryState>
    </Card></>
}
