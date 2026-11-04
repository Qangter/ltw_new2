export function EmptyState({ title = 'Chưa có dữ liệu.', description, action }) {
  return <div className="empty">
    <p className="empty-title">{title}</p>
    {description && <p>{description}</p>}
    {action}
  </div>
}
