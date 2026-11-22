import { QueryState } from '../../components/feedback/QueryState.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { useAuth } from '../auth/useAuth.js'
import { StatCards } from '../statistics/components/StatCards.jsx'
import { SemesterBars } from '../statistics/components/SemesterBars.jsx'
import { DistributionChart, DepartmentChart } from '../statistics/components/DistributionChart.jsx'
import { useStatsQuery } from '../statistics/hooks/useStatsQuery.js'
import heroIllustration from '../../assets/images/dashboard-hero.svg'
import './dashboard.css'

const sectionIcons = {
  bars: <><path d="M4 19h16" /><path d="M7 16V9M12 16V5M17 16v-4" /></>,
  pie: <><path d="M12 3a9 9 0 1 0 9 9h-9z" /><path d="M15 3.5A9 9 0 0 1 20.5 9H15z" /></>,
  trend: <><path d="m4 16 5-5 4 3 7-8" /><path d="M15 6h5v5" /></>,
}

function SectionIcon({ name }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{sectionIcons[name]}</svg>
}

export function DashboardPage() {
  const { user } = useAuth()
  const overview = useStatsQuery('overview')
  const semesters = useStatsQuery('by-semester')
  const distribution = useStatsQuery('distribution')
  const departments = useStatsQuery('by-department')

  return <div className="admin-dashboard">
    <header className="dashboard-heading">
      <div>
        <h1>Tổng quan</h1>
        <p>Xin chào, {user?.full_name || 'Quản trị hệ thống'}</p>
      </div>
    </header>

    <section className="dashboard-hero" aria-label="Hệ thống quản lý điểm thi">
      <div className="dashboard-hero-copy">
        <h2>Hệ thống quản lý điểm thi</h2>
        <p>Tra cứu, quản lý và thống kê điểm thi nhanh chóng, chính xác</p>
        <a href="#/stats" className="dashboard-hero-link">Xem chi tiết <span aria-hidden="true">→</span></a>
      </div>
      <img className="dashboard-hero-art" src={heroIllustration} alt="" aria-hidden="true" />
    </section>

    <section className="dashboard-stats" aria-label="Số liệu tổng quan">
      <QueryState query={overview}>{(data) => <StatCards overview={data} variant="dashboard" />}</QueryState>
    </section>

    <div className="dashboard-panels">
      <Card title="Tỷ lệ đạt theo học kỳ" icon={<SectionIcon name="bars" />} className="dashboard-panel dashboard-semester-panel">
        <QueryState query={semesters}>{(data) => <SemesterBars items={data} />}</QueryState>
      </Card>
      <Card title="Phân bố điểm chữ" icon={<SectionIcon name="pie" />} className="dashboard-panel dashboard-distribution-panel">
        <QueryState query={distribution}>{(data) => <DistributionChart items={data} />}</QueryState>
      </Card>
      <Card title="Sinh viên theo khoa" icon={<SectionIcon name="trend" />} className="dashboard-panel dashboard-department-panel">
        <QueryState query={departments}>{(data) => <DepartmentChart items={data} />}</QueryState>
      </Card>
    </div>
  </div>
}
