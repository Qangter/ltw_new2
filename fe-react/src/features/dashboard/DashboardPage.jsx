import { QueryState } from '../../components/feedback/QueryState.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { useAuth } from '../auth/useAuth.js'
import { StatCards } from '../statistics/components/StatCards.jsx'
import { SemesterBars } from '../statistics/components/SemesterBars.jsx'
import { DistributionChart, DepartmentChart } from '../statistics/components/DistributionChart.jsx'
import { useStatsQuery } from '../statistics/hooks/useStatsQuery.js'

export function DashboardPage() {
  const { user } = useAuth()
  const overview = useStatsQuery('overview')
  const semesters = useStatsQuery('by-semester')
  const distribution = useStatsQuery('distribution')
  const departments = useStatsQuery('by-department')

  return <>
    <h1>Tổng quan</h1>
    <p className="muted">Xin chào, {user.full_name}</p>
    <section aria-label="Số liệu tổng quan" style={{ margin: '16px 0' }}>
      <QueryState query={overview}>{(data) => <StatCards overview={data} variant="dashboard" />}</QueryState>
    </section>
    <div className="grid c2">
      <Card title="Tỷ lệ đạt theo học kỳ">
        <QueryState query={semesters}>{(data) => <SemesterBars items={data} />}</QueryState>
      </Card>
      <Card title="Phân bố điểm chữ">
        <QueryState query={distribution}>{(data) => <DistributionChart items={data} />}</QueryState>
      </Card>
      <Card title="Sinh viên theo khoa">
        <QueryState query={departments}>{(data) => <DepartmentChart items={data} />}</QueryState>
      </Card>
    </div>
  </>
}
