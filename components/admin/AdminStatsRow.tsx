import type { AdminStats } from '@/types'
import StatCard from '@/components/dashboard/StatCard'

interface Props {
  stats: AdminStats
}

export default function AdminStatsRow({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard label="Total Orders" value={stats.totalOrders} />
      <StatCard label="Total Revenue" value={`KSh ${stats.totalRevenue.toLocaleString()}`} />
      <StatCard label="Registered Users" value={stats.totalUsers} />
      <StatCard label="Orders This Week" value={stats.weekOrders} highlight />
    </div>
  )
}
