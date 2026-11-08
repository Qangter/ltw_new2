import { useState } from 'react'
import { QueryState } from '../../components/feedback/QueryState.jsx'
import { EmptyState } from '../../components/feedback/EmptyState.jsx'
import { ConfirmDialog } from '../../components/overlay/ConfirmDialog.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { GradeHistoryModal } from '../grades/GradeHistoryModal.jsx'
import { EntryLeaveGuard } from './EntryLeaveGuard.jsx'
import { GradeEntryRow } from './GradeEntryRow.jsx'
import { useOfferingStudents } from './useOfferings.js'
import { useGradeDrafts } from './useGradeDrafts.js'

export function OfferingEditor({ offering }) {
  const query = useOfferingStudents(offering.id)
  const editor = useGradeDrafts(offering.id)
  const [code, setCode] = useState('')
  const [enrollError, setEnrollError] = useState('')
  const [enrolled, setEnrolled] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [history, setHistory] = useState(null)
  async function add(event) {
    event.preventDefault()
    if (editor.busy) return
    setEnrolled(false)
    if (!code.trim()) { setEnrollError('Nhập mã sinh viên.'); return }
    setEnrollError('')
    const result = await editor.enroll(code)
    if (result.ok) { setCode(''); setEnrolled(true) }
    else setEnrollError(result.error)
  }
  return <section className="card entry-editor" aria-label="Lớp nhập điểm">
    <EntryLeaveGuard dirty={editor.dirty || !!code.trim()} busy={editor.busy} />
    <h2>{offering.subject_code} - {offering.subject_name}</h2>
    <p>Điểm từ 0 đến 10. Cuối kỳ bắt buộc; chuyên cần và giữa kỳ có thể bỏ trống. Nếu thiếu một trong hai điểm thành phần, tổng kết sẽ dùng điểm cuối kỳ.</p>
    <p>Kết quả trong bảng là lần lưu chính thức gần nhất, chưa bao gồm bản nháp.</p>
    <div className="actions"><button type="button" disabled={editor.busy || !editor.dirty} onClick={editor.saveAll}>{editor.bulk ? 'Đang lưu tất cả...' : 'Lưu tất cả'}</button>
      <button type="button" className="sec" disabled={editor.busy || query.isFetching} onClick={() => query.refetch()}>Làm mới dữ liệu</button></div>
    {editor.summary && <p role="status">Lưu tất cả: {editor.summary.succeeded} thành công, {editor.summary.failed} thất bại.</p>}
    <QueryState query={query}>{(rows) => {
      // A background refresh may remove an enrollment; retain its dirty row for recovery.
      const visible = [...rows, ...Object.entries(editor.drafts).filter(([id, draft]) => draft.dirty && !rows.some((row) => String(row.enrollment_id) === id)).map(([, draft]) => draft.row)]
      return visible.length ? <DataTable label="Nhập điểm sinh viên" className="entry-table">
        <thead><tr>{['Mã SV', 'Họ tên', 'Chuyên cần', 'Giữa kỳ', 'Cuối kỳ', 'Tổng kết', 'Xếp loại', 'Kết quả', 'Trạng thái', 'Thao tác'].map((title) => <th scope="col" key={title}>{title}</th>)}</tr></thead>
        <tbody>{visible.map((row) => <GradeEntryRow key={row.enrollment_id} row={row} draft={editor.drafts[row.enrollment_id]} editor={editor}
          onDelete={(target) => { setDeleteError(''); setDeleting(target) }} onHistory={(target) => setHistory({ ...offering, ...target, id: target.grade_id })} />)}</tbody>
      </DataTable> : <EmptyState title="Lớp chưa có sinh viên." />
    }}</QueryState>
    {query.data !== undefined && <form className="entry-enroll" onSubmit={add} noValidate>
      <label htmlFor="entry-student-code">Mã sinh viên thêm vào lớp</label>
      <div className="actions"><input id="entry-student-code" value={code} disabled={editor.busy} aria-invalid={!!enrollError} aria-describedby={enrollError ? 'entry-enroll-error' : undefined} onChange={(event) => { setCode(event.target.value); setEnrollError(''); setEnrolled(false) }} />
        <button type="submit" disabled={editor.busy}>Thêm sinh viên vào lớp</button></div>
      {enrollError && <p role="alert" id="entry-enroll-error" className="form-error">{enrollError}</p>}
      {enrolled && <p role="status">Đã thêm sinh viên vào lớp học phần.</p>}
    </form>}
    {deleting && <ConfirmDialog open title="Xóa điểm" description={`Xóa điểm của ${deleting.student_code} — ${deleting.full_name} trong ${offering.subject_code}? Lịch sử điểm và bản nháp của dòng này sẽ bị xóa; đăng ký học vẫn giữ nguyên.`}
      pending={editor.busy} error={deleteError} danger confirmLabel="Xóa điểm" onCancel={() => setDeleting(null)} onConfirm={async () => {
        const result = await editor.remove(deleting)
        if (result.ok) setDeleting(null); else setDeleteError(result.error)
      }} />}
    {history && <GradeHistoryModal grade={history} onClose={() => setHistory(null)} />}
  </section>
}
