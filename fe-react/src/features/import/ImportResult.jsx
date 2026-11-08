import { DataTable } from '../../components/ui/DataTable.jsx'

export function ImportResult({ result, fileName }) {
  const changed = result.created + result.updated
  const title = result.failed === 0 ? (changed ? 'Import thành công.' : 'Không có dòng nào được nhập.')
    : changed ? 'Import thành công một phần.' : 'Import hoàn tất nhưng tất cả các dòng đều lỗi.'
  return <section className="card import-result" aria-label="Kết quả import">
    <h2 role="status">{title}</h2>
    <p className="import-file-name">File: {fileName}</p>
    <div className="grid c4">
      {[['total', 'Tổng dòng', ''], ['created', 'Thêm mới', 'ok'], ['updated', 'Cập nhật', 'warn'], ['failed', 'Lỗi', 'bad']].map(([key, label, style]) =>
        <div className={`stat ${style}`} key={key}><div className="n">{result[key]}</div><div className="l">{label}</div></div>)}
    </div>
    {result.failed > 0 && <p>{changed > 0 ? 'Các dòng thành công đã được lưu. ' : ''}Hãy kiểm tra và sửa các dòng lỗi trước khi gửi file tiếp theo.</p>}
    {result.failed > result.errors.length && <p role="note">Đang hiển thị {result.errors.length} trên {result.failed} lỗi. Máy chủ chỉ trả tối đa 100 lỗi đầu tiên.</p>}
    {result.errors.length > 0 && <><h3>Chi tiết lỗi</h3><DataTable label="Lỗi import">
      <thead><tr><th scope="col">Dòng Excel</th><th scope="col">Lỗi</th></tr></thead>
      <tbody>{result.errors.map((error, index) => <tr key={`${error.row}-${index}`}><td>{error.row}</td><td className="wrap-cell">{error.message}</td></tr>)}</tbody>
    </DataTable></>}
  </section>
}
