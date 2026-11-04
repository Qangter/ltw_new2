import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../auth/AuthContext.js'
import { DashboardPage } from './DashboardPage.jsx'
import { emptyOverviewFixture, statsResponse } from '../statistics/tests/statsFixtures.js'

function renderDashboard(api, role = 'ADMIN') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<AuthContext.Provider value={{ api, sessionId: `fixture-${role}`, user: { full_name: `Fixture ${role}`, role } }}>
    <QueryClientProvider client={client}><DashboardPage /></QueryClientProvider>
  </AuthContext.Provider>)
}

describe('dashboard with explicit stats API fixtures', () => {
  it.each(['ADMIN', 'TEACHER'])('shows eight cards and the same system-wide charts for %s', async (role) => {
    const api = vi.fn(async (path) => statsResponse(path))
    renderDashboard(api, role)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tổng quan')
    expect(screen.getByText(`Xin chào, Fixture ${role}`)).toBeInTheDocument()
    const summary = screen.getByRole('region', { name: 'Số liệu tổng quan' })
    await within(summary).findByText('Sinh viên')
    const expected = [
      ['Sinh viên', '120'], ['Giáo viên', '12'], ['Môn học', '24'], ['Lớp', '8'],
      ['Bản ghi điểm', '10'], ['Điểm trung bình', '7.37'], ['Tỷ lệ đạt (8)', '81.23%'], ['Tỷ lệ rớt (2)', '18.77%'],
    ]
    expect(summary.querySelectorAll('.stat')).toHaveLength(8)
    for (const [label, value] of expected) expect(within(summary).getByText(label).parentElement.querySelector('.n')).toHaveTextContent(value)
    const semester = screen.getByRole('region', { name: 'Tỷ lệ đạt theo học kỳ' })
    expect(within(semester).getByText('82.34%')).toBeInTheDocument()
    expect(semester.querySelector('.bar i')).toHaveStyle({ width: '82.34%' })
    const grades = screen.getByRole('region', { name: 'Phân bố điểm chữ' })
    expect(grades.querySelector('.pie-chart')).toBeInTheDocument()
    expect(within(grades).getByText('75.0%')).toBeInTheDocument()
    const departments = screen.getByRole('region', { name: 'Sinh viên theo khoa' })
    expect(within(departments).getByText('Khoa Công nghệ thông tin')).toBeInTheDocument()
    expect(within(departments).getByText('25.0%')).toBeInTheDocument()
    expect(api.mock.calls.map(([path]) => path).sort()).toEqual([
      '/api/stats/overview', '/api/stats/by-semester', '/api/stats/distribution', '/api/stats/by-department',
    ].sort())
  })

  it('keeps zero cards, distinguishes null average and handles empty/all-zero charts', async () => {
    const api = vi.fn(async (path) => path.endsWith('/overview') ? emptyOverviewFixture
      : path.endsWith('/by-department') ? [{ department_name: 'Khoa trống', students: '0' }] : [])
    const { container } = renderDashboard(api)
    await screen.findByText('Chưa có dữ liệu học kỳ.')
    expect(screen.getAllByText('Chưa có dữ liệu biểu đồ.')).toHaveLength(2)
    const summary = screen.getByRole('region', { name: 'Số liệu tổng quan' })
    expect(summary.querySelectorAll('.stat')).toHaveLength(8)
    expect(within(summary).getByText('Điểm trung bình').parentElement.querySelector('.n')).toHaveTextContent('—')
    expect(within(summary).getAllByText('0%')).toHaveLength(2)
    expect(container.querySelector('.pie-chart')).not.toBeInTheDocument()
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/)
  })
})
