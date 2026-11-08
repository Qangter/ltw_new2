import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '../../app/AppProviders.jsx'
import { AppRoutes } from '../../app/AppRoutes.jsx'
import { queryKeys } from '../../app/queryKeys.js'
import { deferred, jsonResponse, testSession, userFixture } from '../../test/authFixtures.js'
import { readFixture } from '../../test/readFixtures.js'
import { downloadTemplate, IMPORT_FILE_LIMIT, importResources, validateImportFile } from './importService.js'

const success = { total: 3, created: 1, updated: 2, failed: 0, errors: [] }
const excel = (name = 'diem.xlsx') => new File(['Explicit fixture bytes, no real workbook parsing'], name, { type: 'application/octet-stream' })
function setup({ role = 'ADMIN', handler = () => undefined } = {}) {
  const fetchMock = vi.fn(async (url, options) => {
    const custom = handler(url, options)
    if (custom !== undefined) return custom
    if (url === '/api/auth/me') return jsonResponse(userFixture(role))
    if (url === '/api/import/grades') return jsonResponse(success)
    return jsonResponse(readFixture(url))
  })
  const { session } = testSession({ role, fetchImpl: fetchMock })
  const router = createMemoryRouter([{ path: '*', element: <AppProviders session={session}><AppRoutes /></AppProviders> }], { initialEntries: ['/import'] })
  const rendered = render(<RouterProvider router={router} />)
  return { ...rendered, session, fetchMock, user: userEvent.setup({ applyAccept: false }) }
}
const writes = (mock) => mock.mock.calls.filter(([, options]) => options.method === 'POST')
async function choose(user, file = excel()) { await user.upload(await screen.findByLabelText('File Excel'), file) }
const submit = (user) => user.click(screen.getByRole('button', { name: 'Import', exact: true }))

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })

describe('import file contract', () => {
  it.each(['diem.xlsx', 'DIEM.XLSX', 'old.xls'])('accepts %s without imposing MIME requirements absent from backend', (name) => {
    expect(validateImportFile({ name, size: IMPORT_FILE_LIMIT - 1, type: '' })).toBe('')
  })
  it.each([
    [null, 'Vui lòng chọn'], [{ name: 'diem.csv', size: 1 }, 'đuôi .xlsx'],
    [{ name: 'empty.xlsx', size: 0 }, 'File rỗng'],
    [{ name: 'large.xlsx', size: IMPORT_FILE_LIMIT }, 'nhỏ hơn 5 MiB'],
    [{ name: 'large.xls', size: IMPORT_FILE_LIMIT + 1 }, 'nhỏ hơn 5 MiB'],
  ])('rejects %j', (file, message) => expect(validateImportFile(file)).toContain(message))

  it('downloads through a temporary anchor and revokes the URL after the browser starts', () => {
    vi.useFakeTimers()
    const create = vi.fn(() => 'blob:fixture'), revoke = vi.fn()
    vi.stubGlobal('URL', class extends URL { static createObjectURL = create; static revokeObjectURL = revoke })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      expect(this.download).toBe('excel_template.xlsx')
      expect(this.href).toBe('blob:fixture')
      expect(this.isConnected).toBe(true)
    })
    const blob = new Blob(['fixture workbook'])
    downloadTemplate(blob)
    expect(create).toHaveBeenCalledWith(blob)
    expect(click).toHaveBeenCalledOnce()
    expect(document.querySelector('a[download]')).toBeNull()
    expect(revoke).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(revoke).toHaveBeenCalledExactlyOnceWith('blob:fixture')
  })
})

describe('import page — explicit API fixtures', () => {
  it('validates missing/empty/type/limit locally without uploading; valid selection clears error', async () => {
    const { user, fetchMock } = setup()
    await screen.findByLabelText('File Excel')
    await submit(user)
    expect(screen.getByRole('alert')).toHaveTextContent('Vui lòng chọn')
    for (const [file, message] of [[new File([], 'empty.xlsx'), 'File rỗng'], [excel('invalid.csv'), 'đuôi .xlsx'], [new File([new Uint8Array(IMPORT_FILE_LIMIT)], 'big.xlsx'), 'nhỏ hơn 5 MiB']]) {
      await choose(user, file)
      expect(screen.getByRole('alert')).toHaveTextContent(message)
      expect(screen.getByRole('button', { name: 'Import', exact: true })).toBeDisabled()
    }
    expect(writes(fetchMock)).toHaveLength(0)
    await choose(user)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText(/Đã chọn: diem.xlsx/)).toBeInTheDocument()
  })

  it('sends authenticated FormData/file without manual Content-Type, locks pending and invalidates affected caches', async () => {
    const pending = deferred()
    const { user, session, fetchMock } = setup({ handler: (url) => url === '/api/import/grades' ? pending.promise : undefined })
    const file = excel()
    await choose(user, file)
    const { queryClient, sessionId } = session.getSnapshot()
    const resources = [...importResources, 'users', 'students', 'meta']
    resources.forEach((resource) => queryClient.setQueryData(queryKeys.resource(sessionId, resource), { sentinel: true }))
    await user.dblClick(screen.getByRole('button', { name: 'Import', exact: true }))
    expect(writes(fetchMock)).toHaveLength(1)
    const options = writes(fetchMock)[0][1]
    expect(options.headers.get('Authorization')).toBe('Bearer test-token')
    expect(options.headers.has('Content-Type')).toBe(false)
    expect(options.body).toBeInstanceOf(FormData)
    expect([...options.body.keys()]).toEqual(['file'])
    expect(options.body.get('file')).toBe(file)
    expect(screen.getByLabelText('File Excel')).toBeDisabled()
    expect(screen.getByText(/Đang xử lý file/)).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    await act(async () => pending.resolve(jsonResponse(success)))
    expect(await screen.findByText('Import thành công.')).toBeInTheDocument()
    expect(screen.getByLabelText('Kết quả import')).toHaveTextContent('diem.xlsx')
    importResources.forEach((resource) => expect(queryClient.getQueryState(queryKeys.resource(sessionId, resource)).isInvalidated).toBe(true))
    for (const resource of ['users', 'students', 'meta']) expect(queryClient.getQueryState(queryKeys.resource(sessionId, resource)).isInvalidated).toBe(false)
  })

  it('shows authoritative partial totals, Excel row numbers, business errors and 100-error truncation', async () => {
    const errors = [
      { row: 2, message: 'Không có sinh viên BAD_SV' }, { row: 5, message: 'Không có môn BAD_SUBJECT' },
      { row: 8, message: 'Không có học kỳ "BAD_TERM"' }, { row: 9, message: 'Bạn không dạy môn này trong học kỳ đó' },
      ...Array.from({ length: 96 }, (_, index) => ({ row: index + 10, message: `Lỗi fixture ${index}` })),
    ]
    const { user } = setup({ role: 'TEACHER', handler: (url) => url === '/api/import/grades' ? jsonResponse({ total: 130, created: 5, updated: 4, failed: 121, errors }) : undefined })
    await choose(user)
    await submit(user)
    expect(await screen.findByText('Import thành công một phần.')).toBeInTheDocument()
    const result = screen.getByLabelText('Kết quả import')
    expect([...result.querySelectorAll('.n')].map((item) => item.textContent)).toEqual(['130', '5', '4', '121'])
    expect(screen.getByRole('note')).toHaveTextContent('100 trên 121 lỗi')
    expect(within(screen.getByRole('table', { name: 'Lỗi import' })).getAllByRole('row')).toHaveLength(101)
    expect(screen.getByText('Không có học kỳ "BAD_TERM"')).toBeInTheDocument()
    expect(screen.getByText('Bạn không dạy môn này trong học kỳ đó')).toBeInTheDocument()
  })

  it('all failed rows are a completed response with no invalidation or request failure', async () => {
    const { user, session } = setup({ handler: (url) => url === '/api/import/grades' ? jsonResponse({ total: 1, created: 0, updated: 0, failed: 1, errors: [{ row: 2, message: '<img src=x onerror=alert(1)>' }] }) : undefined })
    await choose(user)
    const invalidate = vi.spyOn(session.getSnapshot().queryClient, 'invalidateQueries')
    await submit(user)
    expect(await screen.findByText('Import hoàn tất nhưng tất cả các dòng đều lỗi.')).toBeInTheDocument()
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(screen.getByLabelText('Kết quả import').querySelector('img')).toBeNull()
    expect(invalidate).not.toHaveBeenCalled()
    expect(screen.queryByText(/Yêu cầu import thất bại/)).not.toBeInTheDocument()
  })

  it.each(['Không đọc được file Excel', 'File không có dữ liệu', 'File thiếu cột: score', 'Tối đa 5000 dòng mỗi lần import', 'File quá lớn (tối đa 5MB)'])('shows request 400: %s and retains selected file', async (message) => {
    const { user, fetchMock } = setup({ handler: (url) => url === '/api/import/grades' ? jsonResponse({ message }, 400) : undefined })
    await choose(user)
    await submit(user)
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.getByRole('alert')).toHaveTextContent('Yêu cầu import thất bại.')
    expect(screen.getByLabelText('File Excel').files[0].name).toBe('diem.xlsx')
    expect(screen.queryByLabelText('Kết quả import')).not.toBeInTheDocument()
    expect(writes(fetchMock)).toHaveLength(1)
  })

  it.each(['network', '500', 'malformed'])('reports uncertain %s outcome without resend or invented counts', async (mode) => {
    const { user, fetchMock, session } = setup({ handler: (url) => {
      if (url !== '/api/import/grades') return
      if (mode === 'network') return Promise.reject(new TypeError('offline'))
      return mode === '500' ? jsonResponse({ message: 'Lỗi máy chủ' }, 500) : jsonResponse({ total: 10 })
    } })
    await choose(user)
    const invalidate = vi.spyOn(session.getSnapshot().queryClient, 'invalidateQueries')
    await submit(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('Chưa xác định được kết quả import.')
    expect(screen.getByRole('alert')).toHaveTextContent('trước khi gửi lại')
    expect(screen.queryByLabelText('Kết quả import')).not.toBeInTheDocument()
    expect(screen.getByLabelText('File Excel').files[0].name).toBe('diem.xlsx')
    await choose(user, excel('other.xlsx'))
    expect(screen.getByRole('alert')).toHaveTextContent('Chưa xác định')
    expect(writes(fetchMock)).toHaveLength(1)
    expect(invalidate).toHaveBeenCalledTimes(importResources.length)
  })

  it('403 is explicit and preserves teacher session; STUDENT guard is tested separately', async () => {
    const { user, session } = setup({ role: 'TEACHER', handler: (url) => url === '/api/import/grades' ? jsonResponse({ message: 'Bạn không có quyền thực hiện thao tác này.' }, 403) : undefined })
    await choose(user)
    await submit(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('không có quyền')
    expect(session.getSnapshot().status).toBe('authenticated')
  })

  it('downloads with authorization, prevents repeated requests and displays template error', async () => {
    const pending = deferred()
    const { user, fetchMock } = setup({ handler: (url) => url === '/api/import/template' ? pending.promise : undefined })
    await user.dblClick(await screen.findByRole('button', { name: 'Tải file mẫu' }))
    const calls = fetchMock.mock.calls.filter(([url]) => url === '/api/import/template')
    expect(calls).toHaveLength(1)
    expect(calls[0][1].headers.get('Authorization')).toBe('Bearer test-token')
    expect(calls[0][1].headers.get('Accept')).toBe('*/*')
    await act(async () => pending.resolve(jsonResponse({ message: 'Không có quyền tải mẫu' }, 403)))
    expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được file mẫu: Không có quyền tải mẫu')
  })

  it('unmount cancels a late template response before creating any object URL', async () => {
    const pending = deferred(), create = vi.fn()
    vi.stubGlobal('URL', class extends URL { static createObjectURL = create })
    const { user, unmount } = setup({ handler: (url) => url === '/api/import/template' ? pending.promise : undefined })
    await user.click(await screen.findByRole('button', { name: 'Tải file mẫu' }))
    unmount()
    await act(async () => pending.resolve(new Response('fixture bytes')))
    expect(create).not.toHaveBeenCalled()
  })

  it('forced session retirement during import cannot expose the result in a new session', async () => {
    const pending = deferred()
    const { user, session } = setup({ handler: (url) => url === '/api/import/grades' ? pending.promise : undefined })
    await choose(user)
    await submit(user)
    await act(async () => session.logout())
    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
    await act(async () => pending.resolve(jsonResponse(success)))
    expect(screen.queryByLabelText('Kết quả import')).not.toBeInTheDocument()
    expect(session.getSnapshot().queryClient.getQueryCache().getAll()).toHaveLength(0)
  })

  it('STUDENT cannot render the page or request template/upload', async () => {
    const { fetchMock } = setup({ role: 'STUDENT' })
    expect(await screen.findByRole('heading', { name: 'Không có quyền truy cập' })).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/me')
  })
})
