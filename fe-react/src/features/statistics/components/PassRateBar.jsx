import { formatNumber } from '../../../utils/format.js'

export function PassRateBar({ value, label, compact = false }) {
  // Clamp only the CSS width; the visible rate is always the server's value.
  const width = value == null || !Number.isFinite(Number(value)) ? 0 : Math.max(0, Math.min(100, Number(value)))
  return <div className="bar-row" style={compact ? { gridTemplateColumns: '1fr 50px', margin: 0 } : undefined}>
    {!compact && <span title={label}>{label}</span>}
    <div className="bar ok" aria-hidden="true"><i style={{ width: `${width}%` }} /></div>
    <b>{formatNumber(value)}{value != null ? '%' : ''}</b>
  </div>
}
