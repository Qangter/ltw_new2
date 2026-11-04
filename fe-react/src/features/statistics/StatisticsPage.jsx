import { QueryState } from '../../components/feedback/QueryState.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { StatCards } from './components/StatCards.jsx'
import { SemesterBars } from './components/SemesterBars.jsx'
import { DistributionBars } from './components/DistributionChart.jsx'
import { SubjectTable } from './components/SubjectTable.jsx'
import { useStatsQuery } from './hooks/useStatsQuery.js'

export function StatisticsPage() {
  const overview = useStatsQuery('overview')
  const semesters = useStatsQuery('by-semester')
  const distribution = useStatsQuery('distribution')
  const subjects = useStatsQuery('by-subject')

  return <>
    <h1>Thống kê đạt/rớt</h1>
    <section aria-label="Số liệu đạt/rớt" style={{ margin: '16px 0' }}>
      <QueryState query={overview}>{(data) => <StatCards overview={data} />}</QueryState>
    </section>
    <div className="grid c2">
      <Card title="Tỷ lệ đạt theo học kỳ">
        <QueryState query={semesters}>{(data) => <SemesterBars items={data} />}</QueryState>
      </Card>
      <Card title="Phân bố điểm chữ">
        <QueryState query={distribution}>{(data) => <DistributionBars items={data} />}</QueryState>
      </Card>
    </div>
    <Card title="Thống kê theo môn học">
      <QueryState query={subjects}>{(data) => <SubjectTable items={data} />}</QueryState>
    </Card>
  </>
}
