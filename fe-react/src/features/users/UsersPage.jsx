import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../app/queryKeys.js'
import { Card } from '../../components/ui/Card.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Pagination } from '../../components/ui/Pagination.jsx'
import { EmptyState } from '../../components/feedback/EmptyState.jsx'
import { QueryState } from '../../components/feedback/QueryState.jsx'
import { ConfirmDialog } from '../../components/overlay/ConfirmDialog.jsx'
import { useRouteFilters } from '../../hooks/useRouteFilters.js'
import { useToast } from '../../hooks/useToast.js'
import { useAuth } from '../auth/useAuth.js'
import { RoleGuard } from '../auth/AuthGate.jsx'
import { useAdminMutation } from './useAdminMutation.js'
import { adminErrorMessage } from './adminFeedback.js'
import { listUsers, setUserActive, resetUserPassword, isUserActive } from './userService.js'
import { UserFilters } from './UserFilters.jsx'

export function UsersPage() {
  return <RoleGuard roles={['ADMIN']}><UserAdministration /></RoleGuard>
}

function UserAdministration() {
  const { api, sessionId, user: currentUser } = useAuth()
  const { notify } = useToast()
  const { filters, apply, setPage, formKey } = useRouteFilters(['q', 'role'], 15)
  const users = useQuery({ queryKey: queryKeys.list(sessionId, 'users', filters), queryFn: ({ signal }) => listUsers(api, filters, signal) })
  const [action, setAction] = useState(null)
  const mutation = useAdminMutation({
    mutationFn: ({ user, type }) => type === 'reset' ? resetUserPassword(api, user.id) : setUserActive(api, user.id, !isUserActive(user)),
    resources: ['users'],
    onSuccess: (result, variables) => { setAction(null); notify(`${variables.user.username}: ${result.message}`, { type: 'success', duration: variables.type === 'reset' ? 0 : 5000 }) },
  })
  useEffect(() => {
    if (users.isSuccess && !users.isFetching && filters.page > Math.max(1, users.data.pages)) setPage(Math.max(1, users.data.pages))
  }, [users.isSuccess, users.isFetching, users.data, filters.page, setPage])
  const title = action?.type === 'reset' ? 'Đặt lại mật khẩu' : action && isUserActive(action.user) ? 'Khóa tài khoản' : 'Mở khóa tài khoản'
  const description = action ? `${title} cho ${action.user.username} — ${action.user.full_name}? ${action.type === 'reset' ? 'Mật khẩu sẽ trở về mặc định theo vai trò tài khoản.' : isUserActive(action.user) ? 'Tài khoản sẽ không thể đăng nhập mới. Phiên đã đăng nhập không bị thu hồi ngay.' : 'Tài khoản sẽ được phép đăng nhập trở lại.'}` : ''
  function choose(user, type) { mutation.reset(); setAction({ user, type }) }
  return <><h1>Tài khoản</h1><Card>
    <UserFilters key={formKey} filters={filters} onApply={apply} disabled={mutation.isPending} />
    <QueryState query={users}>{(page) => <>
      {page.data.length ? <DataTable label="Danh sách tài khoản"><thead><tr>
        {['Username', 'Họ tên', 'Vai trò', 'Trạng thái', 'Thao tác'].map((label) => <th key={label} scope="col">{label}</th>)}
      </tr></thead><tbody>{page.data.map((user) => <tr key={user.id}>
        <td>{user.username}</td><td>{user.full_name}</td><td><Badge value={user.role} /></td><td><Badge value={isUserActive(user) ? 'on' : 'off'} /></td>
        <td><button type="button" className="sm sec" disabled={mutation.isPending || String(user.id) === String(currentUser.id)}
          title={String(user.id) === String(currentUser.id) ? 'Không thể khóa/mở khóa chính tài khoản của bạn' : undefined}
          aria-label={`${isUserActive(user) ? 'Khóa' : 'Mở khóa'} ${user.username}`} onClick={() => choose(user, 'active')}>{isUserActive(user) ? 'Khóa' : 'Mở khóa'}</button>{' '}
          <button type="button" className="sm sec" disabled={mutation.isPending} aria-label={`Đặt lại mật khẩu ${user.username}`} onClick={() => choose(user, 'reset')}>Đặt lại MK</button></td>
      </tr>)}</tbody></DataTable> : <EmptyState title="Không có tài khoản phù hợp." />}
      <Pagination {...page} onPageChange={setPage} disabled={mutation.isPending} />
    </>}</QueryState>
  </Card>
    <ConfirmDialog open={!!action} title={title} description={description} onCancel={() => setAction(null)} onConfirm={() => mutation.submit(action)}
      pending={mutation.isPending} error={adminErrorMessage(mutation.error)} confirmLabel={title} danger={action?.type === 'reset' || (action && isUserActive(action.user))} />
  </>
}
