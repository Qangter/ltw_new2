import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { AppProviders } from '../../../app/AppProviders.jsx'
import { AppRoutes } from '../../../app/AppRoutes.jsx'
import { jsonResponse, testSession, userFixture } from '../../../test/authFixtures.js'
import { readFixture } from '../../../test/readFixtures.js'
import { adminMeta, adminPage, adminStudent, adminUsers } from './adminFixtures.js'
import { AdminRouteProbe } from './AdminRouteProbe.jsx'

export function setupAdmin(path = '/students', { role = 'ADMIN', handler = () => undefined } = {}) {
  const fetchImpl = vi.fn(async (url, options) => {
    const override = handler(url, options)
    if (override !== undefined) return override
    const { pathname, searchParams } = new URL(url, 'http://test.local')
    if (pathname === '/api/auth/me') return jsonResponse(userFixture(role))
    if (options.method !== 'GET') throw new Error(`Unexpected fixture write: ${options.method} ${pathname}`)
    if (pathname === '/api/meta') return jsonResponse(adminMeta)
    if (pathname === '/api/students') return jsonResponse(adminPage([adminStudent], { page: Number(searchParams.get('page') || 1), total: 25 }))
    if (pathname === '/api/admin/users') return jsonResponse(adminPage(adminUsers, { page: Number(searchParams.get('page') || 1), limit: 15, total: 31 }))
    return jsonResponse(readFixture(url))
  })
  const { session } = testSession({ role, fetchImpl })
  const rendered = render(<MemoryRouter initialEntries={[path]}><AppProviders session={session}><AdminRouteProbe /><AppRoutes /></AppProviders></MemoryRouter>)
  return { ...rendered, session, fetchImpl, user: userEvent.setup() }
}

export const writes = (fetchImpl) => fetchImpl.mock.calls.filter(([, options]) => options.method !== 'GET')

export async function openStudentForm(user) {
  await user.click(await screen.findByRole('button', { name: '＋ Thêm sinh viên' }))
  return screen.findByRole('dialog', { name: 'Thêm sinh viên' })
}

export async function fillStudentForm(user) {
  await user.type(screen.getByLabelText('Mã sinh viên'), 'SVNEW43')
  await user.type(screen.getByLabelText('Họ tên', { exact: true }), 'Sinh viên mới')
  await user.type(screen.getByLabelText('Ngày sinh'), '2004-02-29')
  await user.selectOptions(screen.getByRole('dialog').querySelector('select[id$="-class_id"]'), '1')
  await user.type(screen.getByLabelText('Email'), 'new@example.test')
}
