import { act, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { queryKeys } from '../../app/queryKeys.js'
import { deferred, jsonResponse } from '../../test/authFixtures.js'
import { adminMeta, adminPage, adminStudent } from '../users/tests/adminFixtures.js'
import { setupAdmin, writes, openStudentForm, fillStudentForm } from '../users/tests/adminTestUtils.jsx'

describe('student administration through the real auth/API/query integration with fixture transport', () => {
  it('retains the form on an ambiguous network failure and never retries the write automatically', async () => {
    const { user, fetchImpl } = setupAdmin('/students', { handler: (url, options) => {
      if (url === '/api/students/42' && options.method === 'PUT') throw new TypeError('Network disconnected')
    } })
    await user.click(await screen.findByRole('button', { name: 'Sửa SVTEST42' }))
    await user.clear(screen.getByLabelText('Họ tên', { exact: true }))
    await user.type(screen.getByLabelText('Họ tên', { exact: true }), 'Bản nháp khi mất mạng')
    await user.click(screen.getByRole('button', { name: 'Lưu sinh viên' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Yêu cầu có thể đã được xử lý. Hãy kiểm tra dữ liệu trước khi gửi lại.')
    expect(screen.getByLabelText('Họ tên', { exact: true })).toHaveValue('Bản nháp khi mất mạng')
    expect(screen.getByRole('button', { name: 'Lưu sinh viên' })).toBeEnabled()
    expect(writes(fetchImpl)).toHaveLength(1)
  })

  it('clamps a last page when an edit removes the row from the applied status filter', async () => {
    let updated = false
    const { user, fetchImpl } = setupAdmin('/students?q=SV&class_id=1&status=ACTIVE&page=2', { handler: (url, options) => {
      if (options.method === 'PUT') { updated = true; return jsonResponse({ message: 'Đã cập nhật sinh viên' }) }
      if (url.startsWith('/api/students?')) {
        const page = Number(new URL(url, 'http://test.local').searchParams.get('page'))
        return jsonResponse(adminPage(updated && page === 2 ? [] : [updated ? { ...adminStudent, id: 41, student_code: 'SVTEST41' } : adminStudent], { page, total: updated ? 12 : 13 }))
      }
    } })
    await user.click(await screen.findByRole('button', { name: 'Sửa SVTEST42' }))
    await user.selectOptions(within(screen.getByRole('dialog')).getByLabelText('Trạng thái'), 'GRADUATED')
    await user.click(screen.getByRole('button', { name: 'Lưu sinh viên' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await screen.findByText('SVTEST41', { exact: true })
    expect(screen.getByTestId('admin-url')).toHaveTextContent('/students?q=SV&class_id=1&status=ACTIVE')
    expect(screen.getByTestId('admin-url')).not.toHaveTextContent('page=2')
    expect(writes(fetchImpl)).toHaveLength(1)
    expect(JSON.parse(writes(fetchImpl)[0][1].body).status).toBe('GRADUATED')
  })

  it('loads 12 rows per page with URL filters; applying filters resets pagination and Back restores them', async () => {
    const { user, fetchImpl } = setupAdmin('/students?q=old&class_id=1&status=ACTIVE&page=2')
    await screen.findByRole('table', { name: 'Danh sách sinh viên' })
    expect(screen.getByLabelText('Mã / tên')).toHaveValue('old')
    expect(fetchImpl.mock.calls.some(([url]) => url.includes('q=old&class_id=1&status=ACTIVE&page=2&limit=12'))).toBe(true)
    await user.clear(screen.getByLabelText('Mã / tên'))
    await user.type(screen.getByLabelText('Mã / tên'), 'new')
    await user.selectOptions(screen.getByLabelText('Trạng thái'), 'GRADUATED')
    await user.click(screen.getByRole('button', { name: 'Lọc', exact: true }))
    expect(screen.getByTestId('admin-url')).toHaveTextContent('/students?q=new&class_id=1&status=GRADUATED')
    expect(screen.getByTestId('admin-url')).not.toHaveTextContent('page=2')
    await user.click(screen.getByRole('button', { name: 'Test Back' }))
    expect(screen.getByLabelText('Mã / tên')).toHaveValue('old')
    expect(screen.getByLabelText('Trạng thái')).toHaveValue('ACTIVE')
    expect(writes(fetchImpl)).toHaveLength(0)
  })

  it('validates individual fields before sending a create request', async () => {
    const { user, fetchImpl } = setupAdmin()
    await screen.findByRole('table')
    await openStudentForm(user)
    await user.click(screen.getByRole('button', { name: 'Lưu sinh viên' }))
    expect(screen.getByLabelText('Mã sinh viên')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Họ tên', { exact: true })).toHaveAccessibleDescription('Vui lòng nhập họ tên.')
    expect(screen.getByLabelText('Ngày sinh')).toHaveAttribute('aria-invalid', 'true')
    await fillStudentForm(user)
    await user.clear(screen.getByLabelText('Mã sinh viên'))
    await user.type(screen.getByLabelText('Mã sinh viên'), 's!')
    await user.clear(screen.getByLabelText('Email'))
    await user.type(screen.getByLabelText('Email'), 'invalid')
    await user.click(screen.getByRole('button', { name: 'Lưu sinh viên' }))
    expect(screen.getByLabelText('Mã sinh viên')).toHaveAccessibleDescription('Mã sinh viên gồm 3–30 chữ/số, không dấu.')
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Email không hợp lệ.')
    expect(writes(fetchImpl)).toHaveLength(0)
  })

  it('keeps create values on 409, then creates only through /students and invalidates related caches', async () => {
    let duplicate = true
    const { user, session, fetchImpl } = setupAdmin('/students?q=SV&status=ACTIVE', { handler: (url, options) => {
      if (url === '/api/students' && options.method === 'POST') return duplicate
        ? jsonResponse({ message: 'Mã sinh viên hoặc tên đăng nhập đã tồn tại' }, 409)
        : jsonResponse({ id: 43, message: 'Đã thêm sinh viên. Tài khoản: svnew43' }, 201)
    } })
    await screen.findByRole('table')
    const { queryClient, sessionId } = session.getSnapshot()
    const resources = ['users', 'transcripts', 'stats', 'grades', 'grade-history']
    for (const resource of resources) queryClient.setQueryData(queryKeys.detail(sessionId, resource, 'cache-fixture'), { fixture: true })
    await openStudentForm(user)
    await fillStudentForm(user)
    await user.click(screen.getByRole('button', { name: 'Lưu sinh viên' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('đã tồn tại')
    expect(screen.getByLabelText('Mã sinh viên')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Họ tên', { exact: true })).toHaveValue('Sinh viên mới')
    expect(screen.getByLabelText('Email')).toHaveValue('new@example.test')
    duplicate = false
    await user.click(screen.getByRole('button', { name: 'Lưu sinh viên' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByText('Đã thêm sinh viên. Tài khoản: svnew43')).toBeInTheDocument()
    expect(writes(fetchImpl)).toHaveLength(2)
    for (const [url, options] of writes(fetchImpl)) {
      expect(url).toBe('/api/students')
      expect(JSON.parse(options.body)).toMatchObject({ student_code: 'SVNEW43', full_name: 'Sinh viên mới', gender: 'MALE', status: 'ACTIVE', class_id: '1', date_of_birth: '2004-02-29' })
      expect(JSON.parse(options.body)).not.toHaveProperty('password')
    }
    for (const resource of resources) expect(queryClient.getQueryState(queryKeys.detail(sessionId, resource, 'cache-fixture')).isInvalidated).toBe(true)
    expect(screen.getByTestId('admin-url')).toHaveTextContent('/students?q=SV&status=ACTIVE')
  })

  it('sends PUT without changing the code, prevents duplicate writes, and preserves draft after a server 403', async () => {
    const pending = deferred()
    const { user, fetchImpl, session } = setupAdmin('/students', { handler: (url, options) => url === '/api/students/42' && options.method === 'PUT' ? pending.promise : undefined })
    await user.click(await screen.findByRole('button', { name: 'Sửa SVTEST42' }))
    expect(screen.getByLabelText('Mã sinh viên')).toHaveAttribute('readonly')
    expect(screen.getByLabelText('Ngày sinh')).toHaveValue('2003-01-02')
    await user.clear(screen.getByLabelText('Họ tên', { exact: true }))
    await user.type(screen.getByLabelText('Họ tên', { exact: true }), 'Tên đã sửa')
    await user.clear(screen.getByLabelText('Email'))
    await user.type(screen.getByLabelText('Email'), 'changed@example.test')
    const { queryClient, sessionId } = session.getSnapshot()
    await act(async () => { await queryClient.invalidateQueries({ queryKey: queryKeys.resource(sessionId, 'students') }) })
    expect(screen.getByLabelText('Họ tên', { exact: true })).toHaveValue('Tên đã sửa')
    await user.dblClick(screen.getByRole('button', { name: 'Lưu sinh viên' }))
    expect(writes(fetchImpl)).toHaveLength(1)
    expect(screen.getByLabelText('Họ tên', { exact: true })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Hủy', exact: true })).toBeDisabled()
    const payload = JSON.parse(writes(fetchImpl)[0][1].body)
    expect(payload).not.toHaveProperty('student_code')
    expect(payload).toMatchObject({ full_name: 'Tên đã sửa', email: 'changed@example.test', phone: adminStudent.phone, address: adminStudent.address, status: 'ACTIVE', class_id: '1' })
    await act(async () => pending.resolve(jsonResponse({ message: 'Bạn không có quyền thực hiện thao tác này.' }, 403)))
    expect(await screen.findByRole('alert')).toHaveTextContent('không có quyền')
    expect(screen.getByLabelText('Họ tên', { exact: true })).toHaveValue('Tên đã sửa')
    expect(screen.getByLabelText('Email')).toHaveValue('changed@example.test')
    expect(session.getSnapshot().status).toBe('authenticated')
    expect(writes(fetchImpl)).toHaveLength(1)
  })

  it('shows a server field error for a class deleted after metadata was read', async () => {
    const { user } = setupAdmin('/students', { handler: (url, options) => url === '/api/students' && options.method === 'POST' ? jsonResponse({ message: 'Lớp không tồn tại' }, 400) : undefined })
    await screen.findByRole('table')
    const dialog = await openStudentForm(user)
    await fillStudentForm(user)
    await user.click(screen.getByRole('button', { name: 'Lưu sinh viên' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Lớp không tồn tại')
    expect(within(dialog).getByLabelText('Lớp')).toHaveAccessibleDescription('Lớp không tồn tại')
    expect(screen.getByLabelText('Họ tên', { exact: true })).toHaveValue('Sinh viên mới')
  })

  it('requires a named delete confirmation, supports cancel and keeps a blocked student on 409', async () => {
    const message = 'Sinh viên đã có dữ liệu đăng ký/điểm, không thể xóa. Hãy đổi trạng thái thay vì xóa.'
    const { user, fetchImpl } = setupAdmin('/students', { handler: (url, options) => url === '/api/students/42' && options.method === 'DELETE' ? jsonResponse({ message }, 409) : undefined })
    await user.click(await screen.findByRole('button', { name: 'Xóa SVTEST42' }))
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription(expect.stringContaining('SVTEST42 — Sinh viên quản trị'))
    await user.click(screen.getByRole('button', { name: 'Hủy', exact: true }))
    expect(writes(fetchImpl)).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'Xóa SVTEST42' }))
    await user.click(screen.getByRole('button', { name: 'Xóa sinh viên', exact: true }))
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('table')).toHaveTextContent('SVTEST42')
    expect(writes(fetchImpl)).toHaveLength(1)
  })

  it('returns to the last valid page after deleting the only row on the last page, preserving filters', async () => {
    let deleted = false
    const { user, fetchImpl } = setupAdmin('/students?q=SV&class_id=1&status=ACTIVE&page=2', { handler: (url, options) => {
      if (options.method === 'DELETE') { deleted = true; return jsonResponse({ message: 'Đã xóa sinh viên' }) }
      if (url.startsWith('/api/students?')) {
        const page = Number(new URL(url, 'http://test.local').searchParams.get('page'))
        return jsonResponse(adminPage(deleted && page === 2 ? [] : [deleted ? { ...adminStudent, id: 41, student_code: 'SVTEST41' } : adminStudent], { page, total: deleted ? 12 : 13 }))
      }
    } })
    await user.click(await screen.findByRole('button', { name: 'Xóa SVTEST42' }))
    await user.click(screen.getByRole('button', { name: 'Xóa sinh viên', exact: true }))
    await screen.findByText('SVTEST41', { exact: true })
    expect(screen.getByTestId('admin-url')).toHaveTextContent('/students?q=SV&class_id=1&status=ACTIVE')
    expect(screen.getByTestId('admin-url')).not.toHaveTextContent('page=2')
    expect(fetchImpl.mock.calls.some(([url]) => url.includes('q=SV&class_id=1&status=ACTIVE&page=1&limit=12'))).toBe(true)
  })

  it('handles an empty list and unavailable metadata without enabling a create form', async () => {
    const { fetchImpl } = setupAdmin('/students', { handler: (url) => url === '/api/meta' ? jsonResponse({ ...adminMeta, classes: [] }) : url.startsWith('/api/students?') ? jsonResponse(adminPage([])) : undefined })
    await screen.findByText('Không có sinh viên phù hợp.')
    expect(screen.getByText('Chưa có lớp. Chưa thể thêm hoặc sửa sinh viên.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '＋ Thêm sinh viên' })).toBeDisabled()
    expect(writes(fetchImpl)).toHaveLength(0)
  })

  it('does not apply a late successful write or toast after logout', async () => {
    const pending = deferred()
    let signal
    const { user, session } = setupAdmin('/students', { handler: (url, options) => {
      if (options.method === 'DELETE') { signal = options.signal; return pending.promise }
    } })
    await user.click(await screen.findByRole('button', { name: 'Xóa SVTEST42' }))
    await user.click(screen.getByRole('button', { name: 'Xóa sinh viên', exact: true }))
    act(() => session.logout())
    expect(signal.aborted).toBe(true)
    await act(async () => pending.resolve(jsonResponse({ message: 'OLD DELETE SUCCEEDED' })))
    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
    expect(screen.queryByText('OLD DELETE SUCCEEDED')).not.toBeInTheDocument()
    expect(session.getSnapshot().queryClient.getQueryCache().getAll()).toHaveLength(0)
  })
})
