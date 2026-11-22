import { test, expect } from '@playwright/test'

test('admin dashboard matches the desktop overview layout', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.addInitScript(() => localStorage.setItem('token', 'dashboard-visual-fixture'))

  const responses = {
    '/api/auth/me': { id: 1, username: 'fixture-admin', full_name: 'Quản trị hệ thống', role: 'ADMIN' },
    '/api/stats/overview': {
      students: 500, teachers: 25, subjects: 38, classes: 35, grades: 12326,
      avg_score: 6.84, passed: 10694, failed: 1632, pass_rate: 86.76, fail_rate: 13.24,
    },
    '/api/stats/by-semester': [
      { semester_code: 'HK1_2023_2024', pass_rate: 87.56 },
      { semester_code: 'HK2_2023_2024', pass_rate: 86.31 },
      { semester_code: 'HK1_2024_2025', pass_rate: 86.32 },
      { semester_code: 'HK2_2024_2025', pass_rate: 87.17 },
      { semester_code: 'HK1_2025_2026', pass_rate: 86.39 },
    ],
    '/api/stats/distribution': [
      { letter_grade: 'A+', total: 623 }, { letter_grade: 'A', total: 1063 },
      { letter_grade: 'B+', total: 1450 }, { letter_grade: 'B', total: 3409 },
      { letter_grade: 'C+', total: 1578 }, { letter_grade: 'C', total: 2022 },
      { letter_grade: 'D', total: 549 }, { letter_grade: 'F', total: 1632 },
    ],
    '/api/stats/by-department': [
      { department_name: 'Điện tử viễn thông', students: 100 },
      { department_name: 'Công nghệ thông tin', students: 85 },
      { department_name: 'Tài chính Ngân hàng', students: 72 },
      { department_name: 'Kinh tế', students: 72 },
      { department_name: 'Quản trị kinh doanh', students: 57 },
      { department_name: 'Ngôn ngữ Anh', students: 43 },
      { department_name: 'An toàn thông tin', students: 29 },
      { department_name: 'Khác', students: 42 },
    ],
  }

  await page.route('**/api/**', (route) => {
    const path = new URL(route.request().url()).pathname
    return route.fulfill({ json: responses[path] ?? {} })
  })

  await page.goto('/#/dashboard')
  await expect(page.getByRole('heading', { name: 'Tổng quan', level: 1 })).toBeVisible()
  await expect(page.locator('.dashboard-stat')).toHaveCount(8)
  await expect(page.locator('.dashboard-panel')).toHaveCount(3)
  await expect(page.locator('.dashboard-stat').nth(4).locator('.n')).toHaveText('12326')
  await expect(page.getByText('86.76%', { exact: true })).toBeVisible()
  await expect(page.locator('.pie-legend-item')).toHaveCount(16)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)

  const sidebar = await page.locator('.sidebar').boundingBox()
  expect(sidebar.width).toBe(198)
  await page.screenshot({ path: testInfo.outputPath('dashboard-1600.png'), fullPage: true, animations: 'disabled' })
})
