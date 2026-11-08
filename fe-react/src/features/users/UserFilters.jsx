import { useState } from 'react'

export function UserFilters({ filters, onApply, disabled }) {
  const [draft, setDraft] = useState(filters)
  return <form className="toolbar read-filters" onSubmit={(event) => { event.preventDefault(); onApply(draft) }}>
    <div><label htmlFor="users-q">Tìm kiếm</label><input id="users-q" placeholder="username / họ tên" value={draft.q} disabled={disabled} onChange={(event) => setDraft({ ...draft, q: event.target.value })} /></div>
    <div><label htmlFor="users-role">Vai trò</label><select id="users-role" value={draft.role} disabled={disabled} onChange={(event) => setDraft({ ...draft, role: event.target.value })}>
      <option value="">Tất cả</option><option value="ADMIN">Quản trị viên</option><option value="TEACHER">Giáo viên</option><option value="STUDENT">Sinh viên</option>
    </select></div>
    <button type="submit" disabled={disabled}>Lọc</button>
  </form>
}
