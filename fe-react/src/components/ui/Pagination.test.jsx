import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from './Pagination.jsx'
import { EmptyState } from '../feedback/EmptyState.jsx'

describe('Pagination', () => {
  it('preserves the empty message when the API returns zero pages', () => {
    render(<><EmptyState /><Pagination page={1} pages={0} total={0} /></>)
    expect(screen.getByText('Chưa có dữ liệu.')).toBeInTheDocument()
    expect(screen.getByText('Tổng: 0 bản ghi')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('supports bounded navigation without rendering all 1000 page buttons', async () => {
    const onPageChange = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(<Pagination page={1} pages={1000} total={10000} onPageChange={onPageChange} />)
    expect(screen.getByRole('button', { name: 'Trang trước' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Trang 1', exact: true })).toHaveAttribute('aria-current', 'page')
    await user.click(screen.getByRole('button', { name: 'Trang sau' }))
    expect(onPageChange).toHaveBeenLastCalledWith(2)
    rerender(<Pagination page={500} pages={1000} total={10000} onPageChange={onPageChange} />)
    expect(screen.getAllByRole('button').length).toBeLessThanOrEqual(9)
    await user.click(screen.getByRole('button', { name: 'Trang 1000', exact: true }))
    expect(onPageChange).toHaveBeenLastCalledWith(1000)
    rerender(<Pagination page={1000} pages={1000} total={10000} onPageChange={onPageChange} disabled />)
    expect(screen.getAllByRole('button').every((button) => button.disabled)).toBe(true)
  })
})
