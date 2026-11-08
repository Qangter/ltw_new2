export const scoreFields = [
  ['attendance_score', 'Điểm chuyên cần'], ['midterm_score', 'Điểm giữa kỳ'], ['final_score', 'Điểm cuối kỳ'],
]
export const draftValues = (row) => Object.fromEntries(scoreFields.map(([key]) => [key, row[key] == null ? '' : String(row[key])]))
export const valuesEqual = (a, b) => scoreFields.every(([key]) => a[key] === b[key])

// Match parseScore: optional CC/GK, mandatory CK, bounds BEFORE rounding, comma accepted.
// Totals, classification and GPA are exclusively supplied by the API.
export function validateScores(values) {
  const errors = {}, body = {}
  for (const [key, label] of scoreFields) {
    const value = String(values[key] ?? '').trim()
    if (!value) {
      body[key] = null
      if (key === 'final_score') errors[key] = `Thiếu ${label}`
    } else {
      const number = Number(value.replace(',', '.'))
      if (!Number.isFinite(number) || number < 0 || number > 10) errors[key] = `${label} phải là số từ 0 đến 10`
      // Send unrounded input; the controller owns normalization.
      body[key] = value
    }
  }
  return { errors, body }
}
export const normalizedScores = (body) => Object.fromEntries(scoreFields.map(([key]) => [key, body[key] === null ? null : Math.round(Number(body[key].replace(',', '.')) * 100) / 100]))
