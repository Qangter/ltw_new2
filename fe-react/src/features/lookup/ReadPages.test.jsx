import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { AppProviders } from '../../app/AppProviders.jsx'
import { AppRoutes } from '../../app/AppRoutes.jsx'
import { deferred, jsonResponse, testSession, userFixture } from '../../test/authFixtures.js'
import { gradeFixture, readFixture, studentFixture, transcriptFixture } from '../../test/readFixtures.js'
import { formatDate, formatNumber } from '../../utils/format.js'
import { readFilters } from '../../hooks/useRouteFilters.js'

function NavigationProbe() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  return <><output data-testid="url">{pathname}{search}</output><button onClick={() => navigate(-1)}>Test Back</button><button onClick={() => navigate(1)}>Test Forward</button></>
}
function setup(path, role = 'ADMIN', handler = () => undefined) {
  const fetchImpl = vi.fn(async (url, options) => {
    const override = handler(url, options)
    if (override !== undefined) return override
    return jsonResponse(url === '/api/auth/me' ? userFixture(role) : readFixture(url))
  })
  const { session } = testSession({ role, fetchImpl })
  render(<MemoryRouter initialEntries={[path]}><AppProviders session={session}><NavigationProbe /><AppRoutes /></AppProviders></MemoryRouter>)
  return { session, fetchImpl, user: userEvent.setup() }
}

describe('phase 4 read pages (mocked transport)', () => {
  it('lookup restores URL filters/page, submits to page 1, Back/Forward restore form and query', async () => {
    const { user, fetchImpl } = setup('/lookup?q=old&class_id=1&page=2')
    const input = await screen.findByLabelText('Mã số / Họ tên')
    await screen.findByRole('table', { name: 'Kết quả tra cứu sinh viên' })
    expect(input).toHaveValue('old')
    expect(screen.getByLabelText('Lớp')).toHaveValue('1')
    expect(fetchImpl.mock.calls.some(([url]) => url.includes('q=old&class_id=1&page=2&limit=10'))).toBe(true)
    await user.clear(input); await user.type(input, 'new name')
    await user.click(screen.getByRole('button', { name: 'Tìm kiếm' }))
    expect(screen.getByTestId('url')).toHaveTextContent('/lookup?q=new+name&class_id=1')
    expect(screen.getByTestId('url')).not.toHaveTextContent('page=2')
    await user.click(screen.getByRole('button', { name: 'Test Back' }))
    expect(screen.getByLabelText('Mã số / Họ tên')).toHaveValue('old')
    await user.click(screen.getByRole('button', { name: 'Test Forward' }))
    expect(screen.getByLabelText('Mã số / Họ tên')).toHaveValue('new name')
  })
  it('background refetch preserves the unsaved search draft and cached data on failure', async () => {
    let fail = false
    const { user, session } = setup('/lookup', 'ADMIN', (url) => fail && url.startsWith('/api/students?') ? jsonResponse({ message: 'Từ chối đọc' }, 403) : undefined)
    await screen.findByRole('table', { name: 'Kết quả tra cứu sinh viên' })
    await user.type(screen.getByLabelText('Mã số / Họ tên'), 'draft not submitted')
    fail = true
    await act(async () => { await session.getSnapshot().queryClient.invalidateQueries() })
    expect(await screen.findByRole('alert')).toHaveTextContent('Không làm mới được dữ liệu')
    expect(screen.getByRole('table')).toHaveTextContent(studentFixture.student_code)
    expect(screen.getByLabelText('Mã số / Họ tên')).toHaveValue('draft not submitted')
    expect(session.getSnapshot().status).toBe('authenticated')
  })
  it('does not render stale filter results even if old transport ignores abort', async () => {
    const pending = deferred()
    let oldSignal
    const { user } = setup('/lookup?q=slow', 'ADMIN', (url, options) => {
      if (url.includes('/api/students?') && url.includes('q=slow')) { oldSignal = options.signal; return pending.promise }
    })
    const input = await screen.findByLabelText('Mã số / Họ tên')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    await user.clear(input); await user.type(input, 'fast')
    await user.click(screen.getByRole('button', { name: 'Tìm kiếm' }))
    expect(await screen.findByRole('table')).toHaveTextContent('SVTEST42')
    expect(oldSignal.aborted).toBe(true)
    await act(async () => pending.resolve(jsonResponse({ data: [{ ...studentFixture, student_code: 'OLD-RESULT' }], page: 1, pages: 1, total: 1, limit: 10 })))
    expect(screen.queryByText('OLD-RESULT')).not.toBeInTheDocument()
  })
  it('keeps empty/error states visible and offers recovery from an out-of-range page', async () => {
    const { user } = setup('/lookup?page=999', 'ADMIN', (url) => url.includes('/api/students?') && url.includes('page=999') ? jsonResponse({ data: [], page: 999, pages: 1, total: 1, limit: 10 }) : undefined)
    expect(await screen.findByText('Không tìm thấy sinh viên phù hợp.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Về trang đầu' }))
    expect(await screen.findByRole('table')).toBeInTheDocument()
  })
  it('initial error does not masquerade as empty and supports explicit retry', async () => {
    let fail = true
    const { user } = setup('/lookup', 'ADMIN', (url) => fail && url.includes('/api/students?') ? jsonResponse({ message: 'Không có quyền đọc' }, 403) : undefined)
    expect(await screen.findByRole('alert')).toHaveTextContent('Không có quyền đọc')
    expect(screen.queryByText('Không tìm thấy sinh viên phù hợp.')).not.toBeInTheDocument()
    fail = false
    await user.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByRole('table')).toBeInTheDocument()
  })
  it.each([['/my', 'STUDENT', '/api/students/me/transcript'], ['/student/42', 'TEACHER', '/api/students/42/transcript']])('shared transcript at %s uses the correct endpoint and server GPA', async (path, role, endpoint) => {
    const { user, fetchImpl } = setup(path, role)
    const table = await screen.findByRole('table', { name: 'Điểm Học kỳ 1' })
    expect(screen.getByText('7.77')).toBeInTheDocument() // Deliberately differs from grade: do NOT recalculate.
    expect(screen.getByText('02/01/2003')).toBeInTheDocument()
    const cells = within(table).getAllByRole('cell').map((cell) => cell.textContent)
    expect(cells.slice(4, 8)).toEqual(['—', '0', '8.13', '6.5'])
    await user.selectOptions(screen.getByLabelText('Lọc theo học kỳ'), '2')
    expect(screen.getByTestId('url')).toHaveTextContent('semester_id=2')
    await screen.findByRole('table')
    expect(fetchImpl.mock.calls.filter(([url]) => url.includes('/transcript')).every(([url]) => url.startsWith(endpoint))).toBe(true)
    expect(fetchImpl.mock.calls.some(([url]) => url === `${endpoint}?semester_id=2`)).toBe(true)
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    await user.click(screen.getByRole('button', { name: 'In bảng điểm' }))
    expect(print).toHaveBeenCalledTimes(1)
  })
  it('handles missing student and empty transcript without dropping the profile/summary', async () => {
    setup('/student/999', 'ADMIN', (url) => url.includes('/transcript') ? jsonResponse({ message: 'Không tìm thấy sinh viên' }, 404) : undefined)
    expect(await screen.findByRole('alert')).toHaveTextContent('Không tìm thấy sinh viên')
    expect(screen.queryByText('Chưa có dữ liệu điểm.')).not.toBeInTheDocument()
  })
  it('empty transcript keeps server summary and clearly labels selected scope', async () => {
    setup('/my?semester_id=2', 'STUDENT', (url) => url.includes('/transcript') ? jsonResponse({ ...transcriptFixture, grades: [], summary: { gpa: null, subjects: 0, credits: 0, passed_credits: 0, failed_subjects: 0 } }) : undefined)
    expect(await screen.findByText('Chưa có dữ liệu điểm.')).toBeInTheDocument()
    expect(screen.getByText(studentFixture.full_name)).toBeInTheDocument()
    expect(screen.getByText('Phạm vi bảng điểm và điểm trung bình: Học kỳ 2')).toBeInTheDocument()
    expect(screen.getByText('0/0')).toBeInTheDocument()
  })
  it('grade filters include every field/page, history opens on demand and cancels on close', async () => {
    const pending = deferred()
    let historySignal
    const { user, fetchImpl } = setup('/grades?q=SV&semester_id=1&subject_id=1&result=PASSED&page=2', 'ADMIN', (url, options) => {
      if (url.endsWith('/history')) { historySignal = options.signal; return pending.promise }
    })
    await screen.findByRole('table', { name: 'Danh sách điểm' })
    expect(fetchImpl.mock.calls.some(([url]) => url.includes('q=SV&semester_id=1&subject_id=1&result=PASSED&page=2&limit=15'))).toBe(true)
    expect(fetchImpl.mock.calls.some(([url]) => url.endsWith('/history'))).toBe(false)
    const trigger = screen.getByRole('button', { name: `Lịch sử ${gradeFixture.student_code} ${gradeFixture.subject_code}` })
    await user.click(trigger)
    expect(screen.getByRole('dialog')).toHaveTextContent('Đang tải dữ liệu...')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Đóng', exact: true }))
    expect(historySignal.aborted).toBe(true)
    expect(trigger).toHaveFocus()
    await act(async () => pending.resolve(jsonResponse([])))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('history displays old/new zero, reason and actor safely', async () => {
    const { user } = setup('/grades')
    await user.click(await screen.findByRole('button', { name: `Lịch sử ${gradeFixture.student_code} ${gradeFixture.subject_code}` }))
    const dialog = screen.getByRole('dialog')
    expect(await within(dialog).findByText('Phúc khảo kiểm thử')).toBeInTheDocument()
    expect(within(dialog).getByRole('table')).toHaveTextContent('0Không đạt')
  })
  it('normalizes invalid pages and formats values without changing null into zero', () => {
    expect(readFilters(new URLSearchParams('q=a&page=-5'), ['q'], 10)).toEqual({ q: 'a', page: 1, limit: 10 })
    expect(formatNumber(null)).toBe('—'); expect(formatNumber(0)).toBe('0')
    expect(formatNumber(8.125)).toBe('8.13'); expect(formatDate('2000-12-31')).toBe('31/12/2000')
  })
})
