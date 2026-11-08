import { ApiError } from '../../services/apiClient.js'
import { gradeResources } from '../grade-entry/entryService.js'

export const importResources = [...gradeResources, 'offerings']
export const IMPORT_FILE_LIMIT = 5 * 1024 * 1024

export function validateImportFile(file) {
  if (!file) return 'Vui lòng chọn file Excel (.xlsx hoặc .xls).'
  // Match the legacy picker. MIME/extension are not security checks: the server parses the workbook.
  if (!/\.(xlsx|xls)$/i.test(file.name)) return 'Chọn file Excel có đuôi .xlsx hoặc .xls.'
  if (file.size === 0) return 'File rỗng (0 byte). Vui lòng chọn file có dữ liệu.'
  // Verified against installed multer/busboy: reaching fileSize emits LIMIT_FILE_SIZE.
  if (file.size >= IMPORT_FILE_LIMIT) return 'File phải nhỏ hơn 5 MiB (5.242.880 byte).'
  return ''
}

export const getImportTemplate = (api, signal) => api('/api/import/template', { responseType: 'blob', signal })

export async function importGrades(api, file) {
  const body = new FormData()
  body.append('file', file)
  const result = await api('/api/import/grades', { method: 'POST', body })
  // A malformed success response cannot prove which rows committed. Never invent counts.
  if (!result || !['total', 'created', 'updated', 'failed'].every((key) => Number.isInteger(result[key]) && result[key] >= 0)
    || result.total !== result.created + result.updated + result.failed || !Array.isArray(result.errors)
    || !result.errors.every((error) => Number.isInteger(error.row) && typeof error.message === 'string')) {
    throw new ApiError('Máy chủ trả về kết quả import không hợp lệ.', 200)
  }
  return result
}

export const importOutcomeUnknown = (error) => !error.status || error.status >= 500 || error.status === 408 || (error.status >= 200 && error.status < 300)

export function downloadTemplate(blob) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  try {
    anchor.href = url
    anchor.download = 'excel_template.xlsx'
    document.body.append(anchor)
    anchor.click()
  } finally {
    anchor.remove()
    // Give the browser time to start the download. Cleanup survives page-component unmount.
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
