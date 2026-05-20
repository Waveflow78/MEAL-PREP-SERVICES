'use client'
import { useState } from 'react'
import type { Order, OrderStatus } from '@/types'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/Toast'
import Badge from '@/components/ui/Badge'

const STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']

interface Props {
  initialOrders: Order[]
}

export default function OrdersTable({ initialOrders }: Props) {
  const [orders, setOrders] = useState(initialOrders)

  async function updateStatus(id: string, status: OrderStatus) {
    try {
      const updated = await api.patch<Order>(`/api/orders/${id}/status`, { status })
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: updated.status } : o)))
      toast('Status updated')
    } catch {
      toast('Failed to update status', 'error')
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[rgba(45,74,62,0.12)] bg-cream text-left text-xs font-semibold uppercase tracking-wider text-muted">
            {['Order ID', 'Customer', 'Meals', 'Total', 'Status', 'Date'].map((h) => (
              <th key={h} className="px-4 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[rgba(45,74,62,0.08)]">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-cream/50">
              <td className="px-4 py-3 font-mono text-xs text-charcoal">#{order.id.slice(-8).toUpperCase()}</td>
              <td className="px-4 py-3 text-charcoal">{order.user?.name ?? '—'}</td>
              <td className="px-4 py-3 text-mid">{order.items.reduce((s, i) => s + i.qty, 0)}</td>
              <td className="px-4 py-3 font-medium text-charcoal">KSh {order.total.toLocaleString()}</td>
              <td className="px-4 py-3">
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                  className="rounded-lg border border-[rgba(45,74,62,0.25)] bg-cream px-2 py-1 text-xs text-charcoal outline-none focus:border-forest"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </td>
              <td className="px-4 py-3 text-muted">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No orders yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
