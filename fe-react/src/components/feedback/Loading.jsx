export function Loading({ label = 'Đang tải...', inline = false }) {
  return <div className={inline ? 'loading-inline' : 'empty loading-state'} role="status" aria-live="polite">
    {inline && <span className="global-loading-spinner" aria-hidden="true" />}{label}
  </div>
}
