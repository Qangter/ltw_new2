import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { queryKeys } from '../../app/queryKeys.js'
import { AuthContext } from '../auth/AuthContext.js'
import { StatisticsPage } from './StatisticsPage.jsx'
import { deferredStats, emptyOverviewFixture, statsFixtures, statsResponse } from './tests/statsFixtures.js'

function renderStatistics(api) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  render(<AuthContext.Provider value={{ api, sessionId: 'fixture-stats' }}>
    <QueryClientProvider client={client}><StatisticsPage /></QueryClientProvider>
  </AuthContext.Provider>)
  return client
}

describe('statistics with explicit stats API fixtures', () => {
  it('renders four cards, distribution bars and six subject columns without recalculating server aggregates', async () => {
    const api = vi.fn(async (path) => statsResponse(path))
    renderStatistics(api)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Thống kê đạt/rớt')
    await screen.findByText('Lập trình Web')
    const summary = screen.getByRole('region', { name: 'Số liệu đạt/rớt' })
    expect(summary.querySelectorAll('.stat')).toHaveLength(4)
    expect(within(summary).getByText('81.23%')).toBeInTheDocument()
    expect(within(summary).getByText('18.77%')).toBeInTheDocument()
    expect(within(summary).getByText('Tỷ lệ đạt (8 điểm)')).toBeInTheDocument()
    expect(within(summary).getByText('Tỷ lệ rớt (2 điểm)')).toBeInTheDocument()
    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual(['Mã môn', 'Tên môn', 'Số điểm', 'Điểm TB', 'Đạt', 'Tỷ lệ đạt'])
    const row = within(table).getByText('WEB101').closest('tr')
    expect(within(row).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['WEB101', 'Lập trình Web', '10', '7.37', '8', '83.45%'])
    expect(row.querySelector('.bar i')).toHaveStyle({ width: '83.45%' })
    const zero = within(table).getByText('ZERO101').closest('tr')
    expect(within(zero).getAllByRole('cell')[3]).toHaveTextContent('0')
    expect(screen.getByRole('region', { name: 'Phân bố điểm chữ' }).querySelector('.bar')).toBeInTheDocument()
    expect(api.mock.calls.map(([path]) => path).sort()).toEqual([
      '/api/stats/overview', '/api/stats/by-semester', '/api/stats/distribution', '/api/stats/by-subject',
    ].sort())
  })

  it('shows independent initial loading and errors, retries only the failed section', async () => {
    const user = userEvent.setup()
    const pending = deferredStats()
    let failSubjects = true
    const api = vi.fn(async (path) => {
      if (path.endsWith('/distribution')) return pending.promise
      if (path.endsWith('/by-subject') && failSubjects) throw new Error('Fixture: lỗi môn học')
      return statsResponse(path)
    })
    renderStatistics(api)
    expect(await screen.findByRole('alert')).toHaveTextContent('Fixture: lỗi môn học')
    expect(screen.getByText('HK1-2026')).toBeInTheDocument()
    const distribution = screen.getByRole('region', { name: 'Phân bố điểm chữ' })
    expect(within(distribution).getByRole('status')).toBeInTheDocument()
    expect(within(distribution).queryByText('Chưa có dữ liệu biểu đồ.')).not.toBeInTheDocument()
    failSubjects = false
    await user.click(screen.getByRole('button', { name: 'Thử lại' }))
    await screen.findByText('Lập trình Web')
    expect(api.mock.calls.filter(([path]) => path.endsWith('/by-subject'))).toHaveLength(2)
    expect(api.mock.calls.filter(([path]) => path.endsWith('/overview'))).toHaveLength(1)
    await act(async () => pending.resolve(statsFixtures.distribution))
    expect(await within(distribution).findByText('A+')).toBeInTheDocument()
  })

  it('keeps data during background refetch and refetch errors, then retries', async () => {
    const user = userEvent.setup()
    const pending = deferredStats()
    let refresh = false
    const api = vi.fn(async (path) => path.endsWith('/by-subject') && refresh ? pending.promise : statsResponse(path))
    const client = renderStatistics(api)
    await screen.findByText('Lập trình Web')
    refresh = true
    act(() => { void client.invalidateQueries({ queryKey: queryKeys.detail('fixture-stats', 'stats', 'by-subject'), exact: true }) })
    await waitFor(() => expect(api.mock.calls.filter(([path]) => path.endsWith('/by-subject'))).toHaveLength(2))
    expect(screen.getByText('Lập trình Web')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
    await act(async () => pending.reject(new Error('Fixture: mất mạng khi cập nhật')))
    expect(await screen.findByRole('alert')).toHaveTextContent('Fixture: mất mạng khi cập nhật')
    expect(screen.getByText('Lập trình Web')).toBeInTheDocument()
    refresh = false
    await user.click(screen.getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(screen.getByText('Lập trình Web')).toBeInTheDocument()
  })

  it('handles an empty overview, arrays and a zero-count distribution explicitly', async () => {
    renderStatistics(vi.fn(async (path) => path.endsWith('/overview') ? null
      : path.endsWith('/distribution') ? [{ letter_grade: 'A+', total: '0' }] : []))
    await screen.findByText('Chưa có số liệu tổng quan.')
    expect(screen.getByText('Chưa có dữ liệu học kỳ.')).toBeInTheDocument()
    expect(screen.getByText('Chưa có dữ liệu biểu đồ.')).toBeInTheDocument()
    expect(screen.getByText('Chưa có dữ liệu môn học.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('renders zero and null summary values without inventing an average', async () => {
    renderStatistics(vi.fn(async (path) => path.endsWith('/overview') ? emptyOverviewFixture : []))
    await screen.findByText('Điểm trung bình')
    const summary = screen.getByRole('region', { name: 'Số liệu đạt/rớt' })
    expect(within(summary).getByText('—')).toBeInTheDocument()
    expect(within(summary).getAllByText('0%')).toHaveLength(2)
    expect(summary.querySelectorAll('.stat')).toHaveLength(4)
  })
})
