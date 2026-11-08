export function DataTable({ label, children, className = '' }) {
  return <div className="table-wrap" role="region" aria-label={label} tabIndex={0}>
    <table aria-label={label} className={className}>{children}</table>
  </div>
}
