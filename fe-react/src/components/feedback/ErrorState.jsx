export function ErrorState({ message = 'Không thể tải dữ liệu.', onRetry }) {
  return <div className="empty error-state">
    <p role="alert">{message}</p>
    {onRetry && <button type="button" className="sec" onClick={onRetry}>Thử lại</button>}
  </div>
}
