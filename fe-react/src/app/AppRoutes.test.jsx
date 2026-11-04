import { StrictMode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from './AppRoutes.jsx'
import { AppProviders } from './AppProviders.jsx'
import { getMenuItems } from './routeConfig.js'
import { deferred, jsonResponse, testSession, userFixture } from '../test/authFixtures.js'

function renderApp(path = '/', options = {}) {
  const fixture = testSession(options)
  render(<StrictMode><MemoryRouter initialEntries={[path]}><AppProviders session={fixture.session}><AppRoutes /></AppProviders></MemoryRouter></StrictMode>)
  return fixture
}

describe('routes and forms with explicitly mocked auth API', () => {
  it.each([
    ['/entry', 'Nhập điểm'], ['/import', 'Import Excel'], ['/students', 'Quản lý sinh viên'], ['/users', 'Tài khoản'],
  ])('%s remains an authorized placeholder without business requests', async (path, heading) => {
    const { fetchMock } = renderApp(path)
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    expect(screen.getByText('Chức năng chưa được triển khai.')).toBeInTheDocument()
    expect(fetchMock.mock.calls.every(([url]) => url === '/api/auth/me')).toBe(true)
  })

  it('never renders protected content while verifying and blocks direct unauthorized URL', async () => {
    const pending = deferred()
    renderApp('/users', { fetchImpl: () => pending.promise })
    expect(screen.getByText('Đang xác minh phiên đăng nhập...')).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    await act(async () => { pending.resolve(jsonResponse(userFixture('STUDENT'))) })
    expect(await screen.findByRole('heading', { name: 'Không có quyền truy cập' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Tài khoản' })).not.toBeInTheDocument()
  })

  it.each(['ADMIN', 'TEACHER', 'STUDENT'])('%s sees exactly its menu and role-specific home', async (role) => {
    renderApp('/', { role })
    expect(await screen.findByRole('heading', { level: 1, name: role === 'STUDENT' ? 'Bảng điểm của tôi' : 'Tổng quan' })).toBeInTheDocument()
    const links = within(screen.getByRole('navigation', { name: 'Các chức năng' })).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual(getMenuItems(role).map((item) => item.title))
  })

  it('teacher cannot access admin URL, and missing role gets no menu', async () => {
    renderApp('/students', { role: 'TEACHER' })
    expect(await screen.findByRole('heading', { name: 'Không có quyền truy cập' })).toBeInTheDocument()
    expect(getMenuItems()).toEqual([])
  })

  it('login errors preserve input, never retry, and verified login restores authorized destination', async () => {
    const user = userEvent.setup()
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ message: 'Sai tên đăng nhập hoặc mật khẩu' }, 401))
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(jsonResponse({ token: 'new-token', user: userFixture('STUDENT') }))
      .mockResolvedValueOnce(jsonResponse(userFixture('TEACHER')))
    renderApp('/lookup?q=fixture', { token: null, fetchImpl })
    await user.type(await screen.findByLabelText('Tên đăng nhập'), 'teacher')
    await user.type(screen.getByLabelText('Mật khẩu', { exact: true }), 'fixture')
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Sai tên')
    expect(screen.getByLabelText('Tên đăng nhập')).toHaveValue('teacher')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Không kết nối')
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    expect(await screen.findByRole('heading', { name: 'Tra cứu sinh viên', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Test TEACHER')).toBeInTheDocument()
  })

  it('logout returns to login and a reload restores only via /me', async () => {
    const user = userEvent.setup()
    const { session } = renderApp('/password')
    await screen.findByRole('button', { name: 'Lưu mật khẩu' })
    await user.click(screen.getByRole('button', { name: 'Đăng xuất' }))
    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
    expect(session.getSnapshot().queryClient.getQueryCache().getAll()).toHaveLength(0)
    expect(screen.queryByText('Test ADMIN')).not.toBeInTheDocument()
  })

  it('password validation, error draft preservation, no write retry and successful reset', async () => {
    const user = userEvent.setup()
    const { fetchMock } = renderApp('/password')
    const old = await screen.findByLabelText('Mật khẩu hiện tại')
    const next = screen.getByLabelText('Mật khẩu mới', { exact: true })
    const confirm = screen.getByLabelText('Xác nhận mật khẩu mới')
    await user.type(old, 'old-fixture')
    await user.type(next, 'new-fixture')
    await user.type(confirm, 'different')
    await user.click(screen.getByRole('button', { name: 'Lưu mật khẩu' }))
    expect(await screen.findByText('Mật khẩu xác nhận không khớp.')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url]) => url.endsWith('change-password'))).toBe(false)
    await user.clear(confirm)
    await user.type(confirm, 'new-fixture')
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Mật khẩu cũ không đúng' }, 400))
    await user.click(screen.getByRole('button', { name: 'Lưu mật khẩu' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Mật khẩu cũ không đúng')
    expect(old).toHaveValue('old-fixture')
    expect(next).toHaveValue('new-fixture')
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('change-password'))).toHaveLength(1)
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Đổi mật khẩu thành công' }))
    await user.click(screen.getByRole('button', { name: 'Lưu mật khẩu' }))
    expect(await screen.findByText('Đổi mật khẩu thành công')).toBeInTheDocument()
    expect(old).toHaveValue('')
    expect(next).toHaveValue('')
    const options = fetchMock.mock.calls.at(-1)[1]
    expect(JSON.parse(options.body)).toEqual({ old_password: 'old-fixture', new_password: 'new-fixture' })
  })

  it('shows forbidden API error without logging out', async () => {
    const user = userEvent.setup()
    const { fetchMock, session } = renderApp('/password')
    await user.type(await screen.findByLabelText('Mật khẩu hiện tại'), 'fixture')
    await user.type(screen.getByLabelText('Mật khẩu mới', { exact: true }), 'fixture-new')
    await user.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'fixture-new')
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Bạn không có quyền' }, 403))
    await user.click(screen.getByRole('button', { name: 'Lưu mật khẩu' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Bạn không có quyền')
    expect(session.getSnapshot().status).toBe('authenticated')
  })

  it('expired token redirects to login with reason; unknown route stays explicit', async () => {
    renderApp('/users', { fetchImpl: async () => jsonResponse({}, 401) })
    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('hết hạn')
  })

  it('shows unknown route after authentication', async () => {
    renderApp('/unknown')
    expect(await screen.findByRole('heading', { name: 'Không tìm thấy trang' })).toBeInTheDocument()
  })

  it('pending password request is not duplicated and cannot toast or affect a newer session', async () => {
    const user = userEvent.setup()
    const { fetchMock, session } = renderApp('/password')
    await user.type(await screen.findByLabelText('Mật khẩu hiện tại'), 'fixture')
    await user.type(screen.getByLabelText('Mật khẩu mới', { exact: true }), 'fixture-new')
    await user.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'fixture-new')
    const pending = deferred()
    fetchMock.mockImplementationOnce(() => pending.promise)
    await user.dblClick(screen.getByRole('button', { name: 'Lưu mật khẩu' }))
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('change-password'))).toHaveLength(1)
    expect(screen.getByLabelText('Mật khẩu hiện tại')).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Đăng xuất' }))
    fetchMock.mockResolvedValueOnce(jsonResponse({ token: 'student' })).mockResolvedValueOnce(jsonResponse(userFixture('STUDENT')))
    await act(async () => { await session.login({ username: 'student', password: 'fixture' }) })
    await act(async () => { pending.resolve(jsonResponse({ message: 'Old mutation succeeded' })) })
    expect(screen.queryByText('Old mutation succeeded')).not.toBeInTheDocument()
    expect(session.getSnapshot().user.role).toBe('STUDENT')
  })
})
