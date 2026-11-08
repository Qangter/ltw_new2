// Display only: all scores, GPA and aggregates are calculated by the backend.
export const formatNumber = (value) => value == null ? '—' : String(Math.round(Number(value) * 100) / 100)
export const formatDate = (value) => value ? String(value).slice(0, 10).split('-').reverse().join('/') : ''
