import { useState } from 'react'
import { Loading } from '../../components/feedback/Loading.jsx'
import { ImportResult } from './ImportResult.jsx'
import { ImportLeaveGuard } from './ImportLeaveGuard.jsx'
import { importOutcomeUnknown, validateImportFile } from './importService.js'
import { useGradeImport } from './useGradeImport.js'
import './import.css'

export function ImportPage() {
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const operation = useGradeImport()
  const unknown = operation.error && importOutcomeUnknown(operation.error)
  function submit(event) {
    event.preventDefault()
    if (operation.isPending) return
    const error = validateImportFile(file)
    setFileError(error)
    if (!error) void operation.submit(file)
  }
  return <><ImportLeaveGuard pending={operation.isPending} /><h1>Import Excel</h1>
    <section className="card" aria-label="Nhập điểm từ file Excel">
      <h2>Nhập điểm từ Excel</h2>
      <p>Chọn file .xlsx hoặc .xls, nhỏ hơn 5 MiB (5.242.880 byte), tối đa 5.000 dòng dữ liệu. Hệ thống đọc sheet đầu tiên.</p>
      <p>Các cột bắt buộc: <code>student_code</code>, <code>subject_code</code>, <code>semester_name</code>, <code>score</code>. File mẫu còn có full_name, subject_name, credits, academic_year.</p>
      <p>Giáo viên chỉ import môn mình dạy trong học kỳ tương ứng. Hệ thống tìm sinh viên, môn và học kỳ đã tồn tại; có thể thêm đăng ký vào lớp phù hợp.</p>
      <p className="import-warning"><strong>Lưu ý khi cập nhật:</strong> điểm trong file ghi vào điểm cuối kỳ/tổng kết; điểm chuyên cần và giữa kỳ cũ sẽ bị xóa. Mỗi dòng được lưu riêng, dòng lỗi không hoàn tác các dòng đã thành công.</p>
      <button type="button" className="sec" disabled={operation.downloading} onClick={operation.download}>
        {operation.downloading ? 'Đang tải file mẫu...' : 'Tải file mẫu'}
      </button>
      {operation.downloadError && <p role="alert" className="form-error">Không tải được file mẫu: {operation.downloadError}</p>}
      <form className="import-form" onSubmit={submit} noValidate>
        <label htmlFor="import-file">File Excel</label>
        <input id="import-file" type="file" accept=".xlsx,.xls" disabled={operation.isPending}
          aria-invalid={!!fileError} aria-describedby={fileError ? 'import-file-info import-file-error' : 'import-file-info'} onChange={(event) => {
            const selected = event.target.files?.[0] || null
            setFile(selected)
            setFileError(selected ? validateImportFile(selected) : '')
          }} />
        <p id="import-file-info" className="import-file-name">{file ? `Đã chọn: ${file.name} (${file.size.toLocaleString('vi-VN')} byte)` : 'Chưa chọn file.'}</p>
        {fileError && <p id="import-file-error" role="alert" className="form-error">{fileError}</p>}
        <button type="submit" disabled={operation.isPending || !!fileError}>{operation.isPending ? 'Đang xử lý...' : 'Import'}</button>
      </form>
      {operation.isPending && <Loading label="Đang xử lý file. Hãy chờ kết quả; không gửi lại yêu cầu." />}
      {operation.error && <div role="alert" className="form-error">
        <p>{unknown ? 'Chưa xác định được kết quả import.' : 'Yêu cầu import thất bại.'} {operation.error.message}</p>
        {unknown && <p>Máy chủ có thể đã lưu một phần hoặc toàn bộ dữ liệu. Hãy kiểm tra danh sách điểm, bảng điểm và lịch sử trước khi gửi lại. Hệ thống không tự gửi lại file.</p>}
      </div>}
    </section>
    {operation.data && !operation.isPending && <ImportResult result={operation.data} fileName={operation.variables.name} />}
  </>
}
