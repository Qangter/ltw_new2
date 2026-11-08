export function adminErrorMessage(error) {
  if (!error || error.name === 'AbortError') return ''
  return `${error.message}${error.status === 0 ? ' Yêu cầu có thể đã được xử lý. Hãy kiểm tra dữ liệu trước khi gửi lại.' : ''}`
}
