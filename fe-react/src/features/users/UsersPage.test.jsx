import { act, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { deferred, jsonResponse } from '../../test/authFixtures.js'
import { setupAdmin, writes } from './tests/adminTestUtils.jsx'
import { adminPage, adminUsers } from './tests/adminFixtures.js'

describe('account administration with fixture transport', () => {
  it('loads account filters/page and disables changing the current account status', async () => {
    const { user, fetchImpl } = setupAdmin('/users?q=test&role=STUDENT&page=2')
    await screen.findByRole('table', { name: 'Danh sách tài khoản' })
    expect(screen.getByRole('button', { name: 'Khóa admin', exact: true })).toBeDisabled()
    expect(fetchImpl.mock.calls.some(([url]) => url === '/api/admin/users?q=test&role=STUDENT&page=2')).toBe(true)
    expect(screen.getByLabelText('Vai trò')).toHaveValue('STUDENT')
    await user.selectOptions(screen.getByLabelText('Vai trò'), 'TEACHER')
    await user.click(screen.getByRole('button', { name: 'Lọc', exact: true }))
    expect(screen.getByTestId('admin-url')).toHaveTextContent('/users?q=test&role=TEACHER')
    expect(screen.getByTestId('admin-url')).not.toHaveTextContent('page=2')
  })

  it.each([[1, false, 'Khóa'], ['0', true, 'Mở khóa']])('sends a real boolean for is_active=%s after named confirmation', async (initial, next, label) => {
    let active = initial
    const { user, fetchImpl } = setupAdmin('/users?q=sv&role=STUDENT', { handler: (url, options) => {
      if (url.startsWith('/api/admin/users?')) return jsonResponse(adminPage([{ ...adminUsers[1], is_active: active }], { limit: 15 }))
      if (url === '/api/admin/users/9/active') { active = JSON.parse(options.body).is_active; return jsonResponse({ message: 'Đã cập nhật trạng thái' }) }
    } })
    await user.click(await screen.findByRole('button', { name: `${label} svtest42`, exact: true }))
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription(expect.stringContaining('svtest42 — Sinh viên quản trị'))
    await user.click(screen.getByRole('button', { name: 'Hủy', exact: true }))
    expect(writes(fetchImpl)).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: `${label} svtest42`, exact: true }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: `${label} tài khoản`, exact: true }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(writes(fetchImpl)).toHaveLength(1)
    expect(writes(fetchImpl)[0][1].method).toBe('PATCH')
    expect(JSON.parse(writes(fetchImpl)[0][1].body)).toEqual({ is_active: next })
    expect(screen.getByRole('table')).toHaveTextContent(next ? 'Hoạt động' : 'Đã khóa')
    expect(screen.getByTestId('admin-url')).toHaveTextContent('/users?q=sv&role=STUDENT')
  })

  it('reset confirmation prevents duplicate writes, preserves a server error and displays the server result', async () => {
    const pending = deferred()
    let first = true
    const { user, fetchImpl, session } = setupAdmin('/users', { handler: (url) => url === '/api/admin/users/9/reset-password'
      ? first ? pending.promise : jsonResponse({ message: 'Đã đặt lại mật khẩu về mặc định (student123)' }) : undefined })
    await user.click(await screen.findByRole('button', { name: 'Đặt lại mật khẩu svtest42' }))
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription(expect.stringContaining('svtest42 — Sinh viên quản trị'))
    await user.dblClick(within(screen.getByRole('dialog')).getByRole('button', { name: 'Đặt lại mật khẩu', exact: true }))
    expect(writes(fetchImpl)).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Hủy', exact: true })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Đóng hộp thoại' })).toBeDisabled()
    expect(writes(fetchImpl)[0][1].method).toBe('POST')
    expect(writes(fetchImpl)[0][1].body).toBeUndefined()
    await act(async () => pending.resolve(jsonResponse({ message: 'Bạn không có quyền thực hiện thao tác này.' }, 403)))
    expect(await screen.findByRole('alert')).toHaveTextContent('không có quyền')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(session.getSnapshot().status).toBe('authenticated')
    first = false
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Đặt lại mật khẩu', exact: true }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('status')).toHaveTextContent('svtest42: Đã đặt lại mật khẩu về mặc định (student123)')
    expect(writes(fetchImpl)).toHaveLength(2)
  })

  it.each([400, 404, 403])('keeps the status confirmation open when backend rejects it with %s', async (status) => {
    const message = { 400: 'Không thể khóa chính tài khoản của bạn', 404: 'Không tìm thấy người dùng', 403: 'Không đủ quyền' }[status]
    const { user, fetchImpl } = setupAdmin('/users', { handler: (url) => url === '/api/admin/users/9/active' ? jsonResponse({ message }, status) : undefined })
    await user.click(await screen.findByRole('button', { name: 'Khóa svtest42', exact: true }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Khóa tài khoản' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getAllByText('Hoạt động')).toHaveLength(2)
    expect(writes(fetchImpl)).toHaveLength(1)
  })

  it('handles empty list and read denial with retry without logging out', async () => {
    let forbidden = true
    const { user, session } = setupAdmin('/users', { handler: (url) => url.startsWith('/api/admin/users?')
      ? forbidden ? jsonResponse({ message: 'Không được đọc tài khoản' }, 403) : jsonResponse(adminPage([], { limit: 15 })) : undefined })
    expect(await screen.findByRole('alert')).toHaveTextContent('Không được đọc tài khoản')
    expect(session.getSnapshot().status).toBe('authenticated')
    forbidden = false
    await user.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByText('Không có tài khoản phù hợp.')).toBeInTheDocument()
  })

  it.each([['TEACHER', '/users'], ['STUDENT', '/users'], ['TEACHER', '/students'], ['STUDENT', '/students']])('%s cannot access %s or send administration requests', async (role, path) => {
    const { fetchImpl } = setupAdmin(path, { role })
    expect(await screen.findByRole('heading', { name: 'Không có quyền truy cập' })).toBeInTheDocument()
    expect(fetchImpl.mock.calls.every(([url]) => url === '/api/auth/me')).toBe(true)
    expect(writes(fetchImpl)).toHaveLength(0)
  })
})
