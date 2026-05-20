'use client'
import { useState } from 'react'
import type { Order, Meal, AdminStats, Week } from '@/types'
import AdminStatsRow from '@/components/admin/AdminStatsRow'
import OrdersTable from '@/components/admin/OrdersTable'
import MealForm from '@/components/admin/MealForm'
import MenuList from '@/components/admin/MenuList'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/Toast'

interface Props {
  orders: Order[]
  meals: Meal[]
  stats: AdminStats
  activeWeek: Week | null
}

export default function AdminClient({ orders, meals: initialMeals, stats, activeWeek }: Props) {
  const [editMeal, setEditMeal] = useState<Meal | null>(null)
  const [meals, setMeals] = useState(initialMeals)
  const [weekNum, setWeekNum] = useState('')
  const [startDate, setStartDate] = useState('')
  const [savingWeek, setSavingWeek] = useState(false)

  async function refreshMeals() {
    try {
      const updated = await api.get<Meal[]>('/api/admin/meals')
      setMeals(updated)
    } catch { /* silent */ }
  }

  async function activateWeek() {
    if (!weekNum || !startDate) { toast('Enter week number and start date', 'error'); return }
    setSavingWeek(true)
    try {
      await api.post('/api/admin/weeks', { weekNum: Number(weekNum), startDate })
      toast(`Week ${weekNum} activated`)
    } catch {
      toast('Failed to activate week', 'error')
    } finally {
      setSavingWeek(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-10">
      <div>
        <h1 className="font-serif text-3xl font-bold text-charcoal">Admin Panel</h1>
        <p className="mt-1 text-muted">Manage orders, meals, and weekly menu</p>
      </div>

      <AdminStatsRow stats={stats} />

      {/* Orders table */}
      <section>
        <h2 className="mb-4 font-serif text-xl font-semibold text-charcoal">All Orders</h2>
        <OrdersTable initialOrders={orders} />
      </section>

      {/* Meal manager */}
      <section>
        <h2 className="mb-4 font-serif text-xl font-semibold text-charcoal">Meal Manager</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-6">
            <MealForm
              editMeal={editMeal}
              defaultWeekNum={activeWeek?.weekNum ?? 21}
              onSaved={() => { setEditMeal(null); refreshMeals() }}
            />
          </div>
          <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-6">
            <h3 className="mb-4 font-semibold text-charcoal">Current Menu ({meals.length} meals)</h3>
            <MenuList
              initialMeals={meals}
              onEdit={(m) => setEditMeal(m)}
              onDeleted={refreshMeals}
            />
          </div>
        </div>
      </section>

      {/* Week settings */}
      <section>
        <h2 className="mb-4 font-serif text-xl font-semibold text-charcoal">Week Settings</h2>
        <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-6 max-w-lg">
          {activeWeek && (
            <p className="mb-4 text-sm text-mid">
              Active: <strong>Week {activeWeek.weekNum}</strong> — {new Date(activeWeek.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Input label="Week Number" type="number" value={weekNum} onChange={(e) => setWeekNum(e.target.value)} />
            <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <Button variant="primary" loading={savingWeek} onClick={activateWeek}>Activate This Week</Button>
        </div>
      </section>
    </div>
  )
}
