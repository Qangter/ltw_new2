import { useState } from 'react'
import { MetadataSelect } from '../../components/ui/MetadataSelect.jsx'
import { studentStatuses } from './studentForm.js'

export function StudentFilters({ filters, meta, onApply, onAdd, disabled }) {
  const [draft, setDraft] = useState(filters)
  return <form className="toolbar read-filters" onSubmit={(event) => { event.preventDefault(); onApply(draft) }}>
    <div><label htmlFor="students-q">Mã / tên</label><input id="students-q" value={draft.q} onChange={(event) => setDraft({ ...draft, q: event.target.value })} disabled={disabled} /></div>
    <MetadataSelect id="students-class" label="Lớp" value={draft.class_id} options={meta?.classes} getLabel={(item) => item.class_code}
      onChange={(event) => setDraft({ ...draft, class_id: event.target.value })} disabled={disabled || !meta} />
    <div><label htmlFor="students-status">Trạng thái</label><select id="students-status" value={draft.status} disabled={disabled} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
      <option value="">Tất cả</option>{Object.entries(studentStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select></div>
    <button type="submit" disabled={disabled}>Lọc</button>
    <button type="button" className="sec" onClick={onAdd} disabled={disabled || !meta?.classes?.length}>＋ Thêm sinh viên</button>
  </form>
}
