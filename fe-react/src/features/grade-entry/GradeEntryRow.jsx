import { Badge } from '../../components/ui/Badge.jsx'
import { formatNumber } from '../../utils/format.js'
import { draftValues, scoreFields } from './gradeDraft.js'

export function GradeEntryRow({ row, draft, editor, onDelete, onHistory }) {
  const values = draft?.dirty ? draft.values : draftValues(row)
  const locked = editor.bulk || draft?.status === 'saving'
  return <tr data-enrollment={row.enrollment_id}>
    <td>{row.student_code}</td><td className="wrap-cell">{row.full_name}</td>
    {scoreFields.map(([key, label]) => {
      const errorId = `score-${row.enrollment_id}-${key}-error`
      return <td key={key}><input className="score-input" type="text" inputMode="decimal"
        aria-label={`${label} ${row.student_code}`} aria-required={key === 'final_score'} aria-invalid={!!draft?.errors?.[key]}
        aria-describedby={draft?.errors?.[key] ? errorId : undefined}
        value={values[key]} disabled={locked} onChange={(event) => editor.edit(row, key, event.target.value)} />
        {draft?.errors?.[key] && <small id={errorId} className="form-error">{draft.errors[key]}</small>}
      </td>
    })}
    <td>{formatNumber(row.total_score)}</td><td>{row.letter_grade || '—'}</td><td>{row.result ? <Badge value={row.result} /> : '—'}</td>
    <td className="entry-status" aria-live="polite">
      {draft?.status === 'saving' ? 'Đang lưu...' : draft?.status === 'error' ? <span role="alert">{draft.error}</span>
        : draft?.dirty ? 'Chưa lưu' : draft?.status === 'saved' ? 'Đã lưu' : draft?.status === 'deleted' ? 'Đã xóa điểm' : 'Không thay đổi'}
    </td>
    <td><div className="actions"><button type="button" className="sm" disabled={editor.busy || !draft?.dirty} onClick={() => editor.saveOne(row.enrollment_id)}>Lưu</button>
      {row.grade_id != null && <><button type="button" className="sec sm" disabled={editor.busy} onClick={() => onHistory(row)}>Lịch sử</button>
        <button type="button" className="danger sm" disabled={editor.busy} onClick={() => onDelete(row)}>Xóa điểm</button></>}
    </div></td>
  </tr>
}
