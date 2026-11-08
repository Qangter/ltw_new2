import { Loading } from './Loading.jsx'
import { ErrorState } from './ErrorState.jsx'

export function QueryState({ query, children }) {
  if (query.data === undefined) {
    if (query.isError) return <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
    return <Loading label={query.fetchStatus === 'paused' ? 'Đang chờ kết nối mạng...' : 'Đang tải dữ liệu...'} />
  }
  return <>
    <div className="no-print">
      {query.isFetching && <Loading inline label="Đang cập nhật dữ liệu..." />}
      {query.isError && <ErrorState message={`Không làm mới được dữ liệu: ${query.error.message} Dữ liệu bên dưới là lần tải thành công gần nhất.`} onRetry={() => query.refetch()} />}
    </div>
    {typeof children === 'function' ? children(query.data) : children}
  </>
}
