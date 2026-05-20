import type { Order } from '@/types'
import Badge from '@/components/ui/Badge'

interface Props {
  order: Order
}

export default function OrderCard({ order }: Props) {
  const shortId = order.id.slice(-8).toUpperCase()
  const date = new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const totalMeals = order.items.reduce((s, i) => s + i.qty, 0)

  return (
    <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-sm font-semibold text-charcoal">#{shortId}</div>
          <div className="text-xs text-muted">{date} · Week {order.week.weekNum}</div>
        </div>
        <Badge status={order.status} />
      </div>

      {/* Meal tags */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {order.items.map((item) => (
          <span key={item.id} className="rounded-full bg-cream px-2.5 py-1 text-xs text-mid">
            {item.meal.emoji} {item.meal.name} ×{item.qty}
          </span>
        ))}
      </div>

      {/* Macro summary */}
      <div className="mt-4 text-xs text-muted">
        {order.totalCal.toLocaleString()} kcal · {order.totalPro}g protein · {order.totalFib}g fibre
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[rgba(45,74,62,0.12)] pt-4">
        <span className="text-sm text-mid">{totalMeals} meals</span>
        <span className="font-semibold text-charcoal">KSh {order.total.toLocaleString()}</span>
      </div>
    </div>
  )
}
