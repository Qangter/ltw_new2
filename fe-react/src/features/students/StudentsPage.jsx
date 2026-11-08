import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Pagination } from '../../components/ui/Pagination.jsx'
import { QueryState } from '../../components/feedback/QueryState.jsx'
import { EmptyState } from '../../components/feedback/EmptyState.jsx'
import { ConfirmDialog } from '../../components/overlay/ConfirmDialog.jsx'
import { useMeta } from '../../hooks/useMeta.js'
import { useRouteFilters } from '../../hooks/useRouteFilters.js'
import { useToast } from '../../hooks/useToast.js'
import { formatDate } from '../../utils/format.js'
import { useAuth } from '../auth/useAuth.js'
import { RoleGuard } from '../auth/AuthGate.jsx'
import { useStudents } from '../lookup/useStudents.js'
import { useAdminMutation } from '../users/useAdminMutation.js'
import { adminErrorMessage } from '../users/adminFeedback.js'
import { StudentFormDialog } from './StudentFormDialog.jsx'
import { StudentFilters } from './StudentFilters.jsx'
import { deleteStudent, studentResources } from './studentService.js'

export function StudentsPage() {
  return <RoleGuard roles={['ADMIN']}><StudentAdministration /></RoleGuard>
}

function StudentAdministration() {
  const { api } = useAuth()
  const { notify } = useToast()
  const { filters, apply, setPage, formKey } = useRouteFilters(['q', 'class_id', 'status'], 12)
  const meta = useMeta()
  const students = useStudents(filters)
  const [editor, setEditor] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const removal = useAdminMutation({ mutationFn: (student) => deleteStudent(api, student.id), resources: studentResources,
    onSuccess: (result) => { setDeleting(null); notify(result.message, { type: 'success' }) },
  })
  // Clamp using the refreshed server pagination, including deletion of a last row.
  useEffect(() => {
    if (students.isSuccess && !students.isFetching && filters.page > Math.max(1, students.data.pages)) setPage(Math.max(1, students.data.pages))
  }, [students.isSuccess, students.isFetching, students.data, filters.page, setPage])
  return <><h1>Quản lý sinh viên</h1><Card>
    <QueryState query={meta}>{(data) => data.classes.length ? null : <EmptyState title="Chưa có lớp. Chưa thể thêm hoặc sửa sinh viên." />}</QueryState>
    <StudentFilters key={formKey} filters={filters} meta={meta.data} onApply={apply} disabled={removal.isPending} onAdd={() => setEditor({ student: null })} />
    <QueryState query={students}>{(page) => <>
      {page.data.length ? <DataTable label="Danh sách sinh viên"><thead><tr>
        {['Mã SV', 'Họ tên', 'Ngày sinh', 'Lớp', 'Email', 'Trạng thái', 'Thao tác'].map((label) => <th key={label} scope="col">{label}</th>)}
      </tr></thead><tbody>{page.data.map((student) => <tr key={student.id}>
        <td>{student.student_code}</td><td>{student.full_name}</td><td>{formatDate(student.date_of_birth)}</td><td>{student.class_code}</td><td>{student.email || '—'}</td><td><Badge value={student.status} /></td>
        <td><button className="sm sec" type="button" aria-label={`Sửa ${student.student_code}`} disabled={removal.isPending || !meta.data?.classes?.length} onClick={() => setEditor({ student })}>Sửa</button>{' '}
          <button className="sm danger" type="button" aria-label={`Xóa ${student.student_code}`} disabled={removal.isPending} onClick={() => { removal.reset(); setDeleting(student) }}>Xóa</button></td>
      </tr>)}</tbody></DataTable> : <EmptyState title="Không có sinh viên phù hợp." />}
      <Pagination {...page} onPageChange={setPage} disabled={removal.isPending} />
    </>}</QueryState>
  </Card>
    {editor && <StudentFormDialog student={editor.student} classes={meta.data?.classes || []} onClose={() => setEditor(null)}
      onSaved={(result) => { setEditor(null); notify(result.message, { type: 'success' }) }} />}
    <ConfirmDialog open={!!deleting} title="Xóa sinh viên" description={deleting ? `Xóa ${deleting.student_code} — ${deleting.full_name}? Tài khoản đi kèm cũng sẽ bị xóa. Sinh viên đã có đăng ký/điểm không thể xóa; hãy đổi trạng thái thay vì xóa.` : ''}
      onCancel={() => setDeleting(null)} onConfirm={() => removal.submit(deleting)} pending={removal.isPending} error={adminErrorMessage(removal.error)} confirmLabel="Xóa sinh viên" danger />
  </>
}
