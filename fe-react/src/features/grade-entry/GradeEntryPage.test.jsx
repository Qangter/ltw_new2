import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AppProviders } from '../../app/AppProviders.jsx'
import { AppRoutes } from '../../app/AppRoutes.jsx'
import { queryKeys } from '../../app/queryKeys.js'
import { deferred, jsonResponse, testSession, userFixture } from '../../test/authFixtures.js'
import { readFixture } from '../../test/readFixtures.js'
import { entryMeta, entryOfferings, entryRows } from './tests/entryFixtures.js'
import { validateScores } from './gradeDraft.js'

function setup({ handler = () => undefined, role = 'ADMIN' } = {}) {
  let rows = structuredClone(entryRows)
  const fetchMock = vi.fn(async (url, options) => {
    const custom = handler(url, options)
    if (custom !== undefined) return custom
    const path = new URL(url, 'http://test').pathname
    if (path === '/api/auth/me') return jsonResponse(userFixture(role))
    if (path === '/api/meta') return jsonResponse(entryMeta)
    if (path === '/api/offerings') return jsonResponse(entryOfferings)
    if (path === '/api/offerings/11/students') return jsonResponse(rows)
    if (path === '/api/offerings/12/students') return jsonResponse([])
    if (options.method === 'PUT') {
      const id = Number(path.split('/').at(-1))
      const body = JSON.parse(options.body)
      // Deliberately distinctive official result: UI must not calculate totals.
      const result = { id: 100 + id, total: 6.27, letter: 'C', result: 'PASSED', created: true }
      rows = rows.map((row) => row.enrollment_id === id ? { ...row, ...body, grade_id: result.id, total_score: result.total, letter_grade: result.letter, result: result.result } : row)
      return jsonResponse(result)
    }
    if (options.method === 'DELETE') {
      rows = rows.map((row) => row.grade_id === Number(path.split('/').at(-1)) ? { ...row, grade_id: null, attendance_score: null, midterm_score: null, final_score: null, total_score: null, letter_grade: null, result: null } : row)
      return jsonResponse({ message: 'Đã xóa điểm' })
    }
    if (options.method === 'POST') return jsonResponse({ message: 'Đã thêm sinh viên' }, 201)
    return jsonResponse(readFixture(url) ?? [])
  })
  const { session } = testSession({ role, fetchImpl: fetchMock })
  const router = createMemoryRouter([{ path: '*', element: <AppProviders session={session}><AppRoutes /></AppProviders> }], { initialEntries: ['/entry'] })
  render(<RouterProvider router={router} />)
  return { user: userEvent.setup(), fetchMock, session, router }
}
const row = (id) => screen.getByRole('row', { name: new RegExp(`SV00${id}`) })
const input = (id) => screen.getByLabelText(`Điểm cuối kỳ SV00${id}`)
const writes = (mock) => mock.mock.calls.filter(([, options]) => options.method !== 'GET')

describe('grade contract validation', () => {
  it.each(['0', '10', '9,999', '1e1', ' 5.123 '])('accepts backend-valid value %s with optional components', (value) => {
    expect(validateScores({ final_score: value }).errors).toEqual({})
    expect(validateScores({ final_score: value }).body.attendance_score).toBeNull()
  })
  it.each(['', ' ', '-0.01', '10.001', 'abc', 'Infinity'])('rejects %s before rounding', (value) => {
    expect(validateScores({ final_score: value }).errors.final_score).toBeTruthy()
  })
  it('validates both optional fields when supplied and preserves zero', () => {
    const result = validateScores({ attendance_score: '11', midterm_score: '-1', final_score: 0 })
    expect(Object.keys(result.errors)).toEqual(['attendance_score', 'midterm_score'])
    expect(result.body.final_score).toBe('0')
  })
})

describe('entry component with fixture transport', () => {
  it.each([
    ['/api/meta', { ...entryMeta, semesters: [] }, 'Chưa có học kỳ.'],
    ['/api/offerings', [], 'Không có lớp học phần trong học kỳ này.'],
    ['/api/offerings/11/students', [], 'Lớp chưa có sinh viên.'],
  ])('renders separate empty state for %s', async (path, value, text) => {
    setup({ handler: (url) => url.split('?')[0] === path ? jsonResponse(value) : undefined })
    expect(await screen.findByText(text)).toBeInTheDocument()
  })
  it('shows initial error, retries and blocks teacher outside offering without logout', async () => {
    let denied = true
    const { user, session } = setup({ role: 'TEACHER', handler: (url) => url === '/api/offerings/11/students' && denied ? jsonResponse({ message: 'Đây không phải lớp học phần của bạn' }, 403) : undefined })
    expect(await screen.findByRole('alert')).toHaveTextContent('không phải lớp')
    expect(session.getSnapshot().status).toBe('authenticated')
    denied = false
    await user.click(screen.getByRole('button', { name: /Thử lại/ }))
    expect(await screen.findByLabelText('Điểm cuối kỳ SV001')).toBeInTheDocument()
  })
  it('saves only dirty rows, keeps partial failure, displays API result and uses new grade ID', async () => {
    const { user, fetchMock } = setup({ handler: (url, options) => url === '/api/grades/enrollment/2' && options.method === 'PUT' ? jsonResponse({ message: 'Không đủ quyền sửa dòng này' }, 403) : undefined })
    await user.type(await screen.findByLabelText('Điểm cuối kỳ SV001'), '0')
    await user.type(input(2), '10')
    await user.click(screen.getByRole('button', { name: 'Lưu tất cả', exact: true }))
    expect(await screen.findByText('Lưu tất cả: 1 thành công, 1 thất bại.')).toBeInTheDocument()
    expect(writes(fetchMock).map(([url]) => url)).toEqual(['/api/grades/enrollment/1', '/api/grades/enrollment/2'])
    expect(JSON.parse(writes(fetchMock)[0][1].body)).toMatchObject({ final_score: '0', attendance_score: null, midterm_score: null })
    expect(within(row(1)).getByText('6.27')).toBeInTheDocument()
    expect(input(2)).toHaveValue('10')
    expect(within(row(2)).getByRole('alert')).toHaveTextContent('Không đủ quyền')
    await user.click(within(row(1)).getByRole('button', { name: 'Lịch sử' }))
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => url === '/api/grades/101/history')).toBe(true))
    await user.click(screen.getByRole('button', { name: 'Đóng', exact: true }))
    await user.click(within(row(1)).getByRole('button', { name: 'Xóa điểm' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('SV001')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Xóa điểm', exact: true }))
    await waitFor(() => expect(within(row(1)).queryByRole('button', { name: 'Xóa điểm' })).not.toBeInTheDocument())
    expect(writes(fetchMock).at(-1)[0]).toBe('/api/grades/101')
    expect(input(2)).toHaveValue('10')
  })
  it('locks a pending row against repeat save/edit and preserves other drafts across invalidation', async () => {
    const pending = deferred()
    const { user, fetchMock, session } = setup({ handler: (url, options) => url === '/api/grades/enrollment/1' && options.method === 'PUT' ? pending.promise : undefined })
    await user.type(await screen.findByLabelText('Điểm cuối kỳ SV001'), '5')
    const client = session.getSnapshot().queryClient
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    await user.dblClick(within(row(1)).getByRole('button', { name: 'Lưu', exact: true }))
    expect(writes(fetchMock)).toHaveLength(1)
    expect(input(1)).toBeDisabled()
    await user.type(input(2), '7,5')
    await act(async () => pending.resolve(jsonResponse({ id: 101, total: 5, letter: 'D', result: 'PASSED' })))
    await waitFor(() => expect(screen.getByText('Đã lưu')).toBeInTheDocument())
    expect(input(2)).toHaveValue('7,5')
    expect(invalidate.mock.calls.map(([arg]) => arg.queryKey[2])).toEqual(expect.arrayContaining(['offering-students', 'grades', 'transcripts', 'grade-history', 'stats']))
  })
  it('refetch including missing enrollment and missing metadata cannot discard dirty rows', async () => {
    let missing = false
    const { user, session } = setup({ handler: (url) => missing && ['/api/offerings/11/students', '/api/offerings?semester_id=1'].includes(url) ? jsonResponse([]) : undefined })
    await user.type(await screen.findByLabelText('Điểm cuối kỳ SV001'), '8')
    missing = true
    await act(async () => session.getSnapshot().queryClient.invalidateQueries({ queryKey: queryKeys.all(session.getSnapshot().sessionId) }))
    expect(input(1)).toHaveValue('8')
    expect(within(row(1)).getByText('Chưa lưu')).toBeInTheDocument()
  })
  it('shows field errors without request, keeps network failure draft and never retries writes', async () => {
    const { user, fetchMock } = setup({ handler: (url, options) => options.method === 'PUT' ? Promise.reject(new TypeError('offline')) : undefined })
    await user.type(await screen.findByLabelText('Điểm chuyên cần SV001'), '10.001')
    await user.click(within(row(1)).getByRole('button', { name: 'Lưu', exact: true }))
    expect(screen.getByText('Thiếu Điểm cuối kỳ')).toBeInTheDocument()
    expect(screen.getByText('Điểm chuyên cần phải là số từ 0 đến 10')).toBeInTheDocument()
    expect(writes(fetchMock)).toHaveLength(0)
    await user.clear(screen.getByLabelText('Điểm chuyên cần SV001'))
    await user.type(input(1), '0')
    await user.click(within(row(1)).getByRole('button', { name: 'Lưu', exact: true }))
    expect(await screen.findByRole('alert')).toHaveTextContent('có thể đã được xử lý')
    expect(input(1)).toHaveValue('0')
    expect(writes(fetchMock)).toHaveLength(1)
  })
  it('enroll errors keep code, successful enroll refreshes counts without losing drafts', async () => {
    let duplicate = true
    const { user, fetchMock } = setup({ handler: (url, options) => options.method === 'POST' && duplicate ? jsonResponse({ message: 'Sinh viên đã đăng ký lớp học phần này' }, 409) : undefined })
    await user.type(await screen.findByLabelText('Điểm cuối kỳ SV001'), '8')
    await user.type(screen.getByLabelText('Mã sinh viên thêm vào lớp'), 'SVNEW')
    await user.click(screen.getByRole('button', { name: 'Thêm sinh viên vào lớp' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('đã đăng ký')
    expect(screen.getByLabelText('Mã sinh viên thêm vào lớp')).toHaveValue('SVNEW')
    duplicate = false
    await user.click(screen.getByRole('button', { name: 'Thêm sinh viên vào lớp' }))
    expect(await screen.findByText('Đã thêm sinh viên vào lớp học phần.')).toBeInTheDocument()
    expect(input(1)).toHaveValue('8')
    expect(fetchMock.mock.calls.filter(([url]) => url.startsWith('/api/offerings?'))).toHaveLength(2)
  })
  it('confirms semester change and logout; cancel preserves draft', async () => {
    const { user } = setup()
    await user.type(await screen.findByLabelText('Điểm cuối kỳ SV001'), '8')
    await user.selectOptions(screen.getByLabelText('Học kỳ'), '2')
    expect(screen.getByRole('dialog', { name: 'Rời trang nhập điểm?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Hủy', exact: true }))
    expect(screen.getByLabelText('Học kỳ')).toHaveValue('1')
    expect(input(1)).toHaveValue('8')
    await user.click(screen.getByRole('button', { name: 'Đăng xuất' }))
    await user.click(screen.getByRole('button', { name: 'Bỏ thay đổi và tiếp tục' }))
    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
  })
  it('denies STUDENT before requesting entry data', async () => {
    const { fetchMock } = setup({ role: 'STUDENT' })
    expect(await screen.findByRole('heading', { name: 'Không có quyền truy cập' })).toBeInTheDocument()
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/api/auth/me'])
  })
  it('late student response for an old offering cannot replace the current offering', async () => {
    const pending = deferred()
    const { user } = setup({ handler: (url) => url === '/api/offerings/11/students' ? pending.promise : undefined })
    await user.selectOptions(await screen.findByLabelText('Lớp học phần'), '12')
    expect(await screen.findByText('Lớp chưa có sinh viên.')).toBeInTheDocument()
    await act(async () => pending.resolve(jsonResponse(entryRows)))
    expect(screen.queryByLabelText('Điểm cuối kỳ SV001')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Lớp học phần')).toHaveValue('12')
  })
  it('failed delete retains the row draft and displays the named confirmation error', async () => {
    const { user, fetchMock } = setup({ handler: (url, options) => options.method === 'DELETE' ? jsonResponse({ message: 'Bạn không có quyền xóa điểm này' }, 403) : undefined })
    await user.type(await screen.findByLabelText('Điểm cuối kỳ SV001'), '8')
    await user.clear(input(3))
    await user.type(input(3), '9')
    await user.click(within(row(3)).getByRole('button', { name: 'Xóa điểm' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Xóa điểm', exact: true }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('không có quyền')
    await user.click(within(dialog).getByRole('button', { name: 'Hủy' }))
    expect(input(3)).toHaveValue('9')
    expect(input(1)).toHaveValue('8')
    expect(writes(fetchMock)).toHaveLength(1)
  })
  it('uses official save response even if subsequent GET fails; dirty sibling survives', async () => {
    let saved = false
    const { user } = setup({ handler: (url, options) => {
      if (options.method === 'PUT') saved = true
      if (url === '/api/offerings/11/students' && saved) return jsonResponse({ message: 'Không thể tải lại lớp' }, 403)
    } })
    await user.type(await screen.findByLabelText('Điểm cuối kỳ SV001'), '0')
    await user.type(input(2), '9')
    await user.click(within(row(1)).getByRole('button', { name: 'Lưu', exact: true }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Không làm mới được dữ liệu')
    expect(within(row(1)).getByText('6.27')).toBeInTheDocument()
    expect(input(1)).toHaveValue('0')
    expect(input(2)).toHaveValue('9')
    expect(within(row(1)).getByRole('button', { name: 'Xóa điểm' })).toBeEnabled()
  })
})
