export function MetadataSelect({ id, name, label, value, onChange, options = [], getLabel, allLabel = 'Tất cả', disabled = false }) {
  const unknown = value && !options.some((item) => String(item.id) === String(value))
  return <div><label htmlFor={id}>{label}</label>
    <select id={id} name={name} value={value} onChange={onChange} disabled={disabled}>
      <option value="">{allLabel}</option>
      {unknown && <option value={value}>ID {value} (chưa có trong danh mục)</option>}
      {options.map((item) => <option key={item.id} value={item.id}>{getLabel(item)}</option>)}
    </select>
  </div>
}
