import { Badge } from '../ui/Badge.jsx'
import { Card } from '../ui/Card.jsx'
import { EmptyState } from './EmptyState.jsx'

export function FeaturePlaceholder({ title, stage, description }) {
  return <>
    <div className="page-heading"><h1>{title}</h1><Badge value="pending" /></div>
    <Card>
      <EmptyState title="Chức năng chưa được triển khai."
        description={description || `Trang này sẽ được xây dựng ở giai đoạn ${stage}. Hiện chưa tải hoặc thay đổi dữ liệu.`} />
    </Card>
  </>
}
