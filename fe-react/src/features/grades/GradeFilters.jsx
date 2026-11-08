import { useState } from 'react'
import { MetadataSelect } from '../../components/ui/MetadataSelect.jsx'

export function GradeFilters({ filters, meta, onApply }) {
  const [draft, setDraft] = useState(filters)
  const change = (event) => setDraft({ ...draft, [event.target.name]: event.target.value })
  return <form className="toolbar read-filters" onSubmit={(event) => { event.preventDefault(); onApply(draft) }}>
    <div><label htmlFor="grades-q">Mã / tên SV</label><input id="grades-q" name="q" value={draft.q} onChange={change} /></div>
    <MetadataSelect id="grades-semester" name="semester_id" label="Học kỳ" value={draft.semester_id} options={meta?.semesters} getLabel={(item) => item.semester_name} onChange={change} disabled={!meta} />
    <MetadataSelect id="grades-subject" name="subject_id" label="Môn học" value={draft.subject_id} options={meta?.subjects} getLabel={(item) => `${item.subject_code} - ${item.subject_name}`} onChange={change} disabled={!meta} />
    <div><label htmlFor="grades-result">Kết quả</label><select id="grades-result" name="result" value={draft.result} onChange={change}>
      <option value="">Tất cả</option><option value="PASSED">Đạt</option><option value="FAILED">Không đạt</option>
    </select></div><button type="submit">Lọc</button>
  </form>
}
