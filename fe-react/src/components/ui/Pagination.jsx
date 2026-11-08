import { getPageItems } from '../../utils/pagination.js'

export function Pagination({ page = 1, pages = 0, total = 0, onPageChange, disabled = false }) {
  if (pages <= 1) return <p className="muted">Tổng: {total} bản ghi</p>
  return <nav className="pager" aria-label="Phân trang">
    <span className="muted">Tổng {total} bản ghi</span>
    <button type="button" disabled={disabled || page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Trang trước">‹</button>
    {getPageItems(page, pages).map((item) => typeof item === 'number'
      ? <button type="button" key={item} className={page === item ? 'cur' : undefined}
        aria-label={`Trang ${item}`} aria-current={page === item ? 'page' : undefined}
        disabled={disabled || page === item} onClick={() => onPageChange(item)}>{item}</button>
      : <span key={item} aria-hidden="true">…</span>)}
    <button type="button" disabled={disabled || page >= pages} onClick={() => onPageChange(page + 1)} aria-label="Trang sau">›</button>
  </nav>
}
