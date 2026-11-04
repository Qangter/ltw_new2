import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { routeConfig } from './routeConfig.js'
import { AppLayout } from '../components/layout/AppLayout.jsx'
import { Loading } from '../components/feedback/Loading.jsx'
import { LoginPage } from '../features/auth/LoginPage.jsx'
import { ChangePasswordPage } from '../features/auth/ChangePasswordPage.jsx'
import { DashboardPage } from '../features/dashboard/DashboardPage.jsx'
import { MyTranscriptPage } from '../features/transcripts/MyTranscriptPage.jsx'
import { StudentTranscriptPage } from '../features/transcripts/StudentTranscriptPage.jsx'
import { LookupPage } from '../features/lookup/LookupPage.jsx'
import { GradeEntryPage } from '../features/grade-entry/GradeEntryPage.jsx'
import { ImportPage } from '../features/import/ImportPage.jsx'
import { GradeListPage } from '../features/grades/GradeListPage.jsx'
import { StatisticsPage } from '../features/statistics/StatisticsPage.jsx'
import { StudentsPage } from '../features/students/StudentsPage.jsx'
import { UsersPage } from '../features/users/UsersPage.jsx'
import { NotFoundPage } from '../features/not-found/NotFoundPage.jsx'
import { AuthGate, RoleGuard } from '../features/auth/AuthGate.jsx'

const PreviewPage = import.meta.env.DEV ? lazy(() => import('../features/preview/ComponentPreviewPage.jsx')) : null
const pages = {
  '/dashboard': DashboardPage,
  '/my': MyTranscriptPage,
  '/lookup': LookupPage,
  '/student/:id': StudentTranscriptPage,
  '/entry': GradeEntryPage,
  '/import': ImportPage,
  '/grades': GradeListPage,
  '/stats': StatisticsPage,
  '/students': StudentsPage,
  '/users': UsersPage,
  '/password': ChangePasswordPage,
}

export function AppRoutes() {
  const { pathname } = useLocation()
  useEffect(() => {
    const route = routeConfig.find((item) => item.path === pathname || (item.path === '/student/:id' && /^\/student\/[^/]+$/.test(pathname)))
    document.title = `${route?.title || (import.meta.env.DEV && pathname === '/__components' ? 'Kiểm tra component' : 'Không tìm thấy trang')} — Cổng học vụ`
    document.getElementById('main-content')?.focus()
  }, [pathname])

  return <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<LoginPage />} />
    <Route element={<AuthGate />}>
    <Route element={<AppLayout />}>
      {routeConfig.filter((route) => route.path !== '/login').map(({ path, roles }) => {
        const Page = pages[path]
        return <Route key={path} path={path} element={<RoleGuard roles={roles}><Page /></RoleGuard>} />
      })}
      {PreviewPage && <Route path="/__components" element={<Suspense fallback={<Loading />}><PreviewPage /></Suspense>} />}
      <Route path="*" element={<NotFoundPage />} />
    </Route>
    </Route>
  </Routes>
}
