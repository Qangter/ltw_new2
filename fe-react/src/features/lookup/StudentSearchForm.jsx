import { useState } from 'react'
import { MetadataSelect } from '../../components/ui/MetadataSelect.jsx'

export function StudentSearchForm({ filters, meta, onApply }) {
  const [draft, setDraft] = useState(filters)
  return <form className="toolbar read-filters" onSubmit={(event) => { event.preventDefault(); onApply(draft) }}>
    <div><label htmlFor="lookup-q">Mã số / Họ tên</label><input id="lookup-q" name="q" value={draft.q} onChange={(event) => setDraft({ ...draft, q: event.target.value })} placeholder="VD: SV0001 hoặc Nguyễn Văn" /></div>
    <MetadataSelect id="lookup-class" name="class_id" label="Lớp" value={draft.class_id} options={meta?.classes}
      getLabel={(item) => item.class_code} allLabel="Tất cả lớp" disabled={!meta}
      onChange={(event) => setDraft({ ...draft, class_id: event.target.value })} />
    <button type="submit">Tìm kiếm</button>
  </form>
}
