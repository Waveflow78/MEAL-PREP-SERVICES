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

interface EmployeeSummary {
  id: string
  name: string
  email: string
  phone: string | null
  createdAt: string
  timeEntries: { id: string; checkIn: string; checkOut: string | null; note: string | null }[]
}

interface UserSummary {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'COACH' | 'CUSTOMER'
  coachId: string | null
  coach: { id: string; name: string } | null
}

interface Props {
  orders: Order[]
  meals: Meal[]
  stats: AdminStats
  activeWeek: Week | null
  allUsers: UserSummary[]
  employees: EmployeeSummary[]
}

type AdminTab = 'overview' | 'meals-ordered' | 'employees' | 'meal-manager' | 'settings'

function fmtTime(dt: string | null) {
  if (!dt) return '—'
  return new Date(dt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}
function fmtDuration(a: string, b: string | null) {
  const ms = (b ? new Date(b) : new Date()).getTime() - new Date(a).getTime()
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000)
  return `${h}h ${m}m`
}

export default function AdminClient({ orders, meals: initialMeals, stats, activeWeek, allUsers: initialUsers, employees: initialEmployees }: Props) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')

  // Meal manager state
  const [editMeal, setEditMeal] = useState<Meal | null>(null)
  const [meals, setMeals] = useState(initialMeals)

  // Week state
  const [weekNum, setWeekNum] = useState('')
  const [startDate, setStartDate] = useState('')
  const [savingWeek, setSavingWeek] = useState(false)

  // Employee state
  const [employees, setEmployees] = useState<EmployeeSummary[]>(initialEmployees)
  const [newEmpName, setNewEmpName] = useState('')
  const [newEmpPhone, setNewEmpPhone] = useState('')
  const [empBusy, setEmpBusy] = useState(false)
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null)

  // Coach management state
  const [users, setUsers] = useState<UserSummary[]>(initialUsers)
  const [promoteId, setPromoteId] = useState('')
  const [assignClientId, setAssignClientId] = useState('')
  const [assignCoachId, setAssignCoachId] = useState('')
  const [coachBusy, setCoachBusy] = useState(false)

  // Expanded order rows in Meals Ordered tab
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  // ── Helpers ──────────────────────────────────────────────────────────
  async function createEmployee() {
    if (!newEmpName.trim()) { toast('Enter employee name', 'error'); return }
    setEmpBusy(true)
    try {
      const { employee, plainPassword } = await api.post<{ employee: EmployeeSummary; plainPassword: string }>(
        '/api/admin/employees',
        { name: newEmpName.trim(), phone: newEmpPhone.trim() || undefined }
      )
      setCreatedCreds({ email: employee.email, password: plainPassword })
      setEmployees((prev) => [...prev, { ...employee, timeEntries: [] }])
      setNewEmpName(''); setNewEmpPhone('')
      toast(`Employee "${employee.name}" created`)
    } catch { toast('Failed to create employee', 'error') }
    finally { setEmpBusy(false) }
  }

  async function refreshMeals() {
    try { setMeals(await api.get<Meal[]>('/api/admin/meals')) } catch { /* silent */ }
  }

  async function refreshUsers() {
    try { setUsers(await api.get<UserSummary[]>('/api/admin/coaches')) } catch { /* silent */ }
  }

  async function activateWeek() {
    if (!weekNum || !startDate) { toast('Enter week number and start date', 'error'); return }
    setSavingWeek(true)
    try {
      await api.post('/api/admin/weeks', { weekNum: Number(weekNum), startDate })
      toast(`Week ${weekNum} activated`)
    } catch { toast('Failed to activate week', 'error') }
    finally { setSavingWeek(false) }
  }

  async function promoteToCoach() {
    if (!promoteId) { toast('Select a user first', 'error'); return }
    setCoachBusy(true)
    try {
      await api.post('/api/admin/coaches', { action: 'promote', userId: promoteId })
      toast('User promoted to Coach'); setPromoteId(''); await refreshUsers()
    } catch { toast('Failed to promote user', 'error') }
    finally { setCoachBusy(false) }
  }

  async function demoteCoach(userId: string) {
    setCoachBusy(true)
    try {
      await api.post('/api/admin/coaches', { action: 'demote', userId })
      toast('Coach demoted to Customer'); await refreshUsers()
    } catch { toast('Failed to demote coach', 'error') }
    finally { setCoachBusy(false) }
  }

  async function assignClientToCoach() {
    if (!assignClientId || !assignCoachId) { toast('Select both a client and a coach', 'error'); return }
    setCoachBusy(true)
    try {
      await api.post('/api/admin/coaches', { action: 'assign', clientId: assignClientId, coachId: assignCoachId })
      toast('Client assigned to coach'); setAssignClientId(''); setAssignCoachId(''); await refreshUsers()
    } catch { toast('Failed to assign client', 'error') }
    finally { setCoachBusy(false) }
  }

  async function unassignClient(clientId: string) {
    setCoachBusy(true)
    try {
      await api.post('/api/admin/coaches', { action: 'unassign', clientId })
      toast('Client unassigned'); await refreshUsers()
    } catch { toast('Failed to unassign client', 'error') }
    finally { setCoachBusy(false) }
  }

  // ── Meal order aggregation ────────────────────────────────────────────
  interface MealStat {
    mealId: string
    name: string
    emoji: string
    totalQty: number
    orderCount: number
    revenue: number
  }
  const mealStatsMap = new Map<string, MealStat>()
  for (const order of orders) {
    for (const item of order.items) {
      const key = item.mealId
      const existing = mealStatsMap.get(key)
      if (existing) {
        existing.totalQty += item.qty
        existing.orderCount += 1
        existing.revenue += item.linePrice
      } else {
        mealStatsMap.set(key, {
          mealId: item.mealId,
          name: item.meal?.name ?? 'Unknown',
          emoji: item.meal?.emoji ?? '🍽️',
          totalQty: item.qty,
          orderCount: 1,
          revenue: item.linePrice,
        })
      }
    }
  }
  const mealStats = Array.from(mealStatsMap.values()).sort((a, b) => b.totalQty - a.totalQty)

  // ── Tab config ────────────────────────────────────────────────────────
  const coaches = users.filter((u) => u.role === 'COACH')
  const customers = users.filter((u) => u.role === 'CUSTOMER')

  const TABS: { id: AdminTab; label: string }[] = [
    { id: 'overview',      label: '📋 Overview' },
    { id: 'meals-ordered', label: '🍱 Meals Ordered' },
    { id: 'employees',     label: '👥 Employees' },
    { id: 'meal-manager',  label: '🥘 Meal Manager' },
    { id: 'settings',      label: '⚙️ Settings' },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-charcoal">Admin Panel</h1>
        <p className="mt-1 text-muted">Manage orders, meals, coaches, and weekly menu</p>
      </div>

      {/* Stats always visible */}
      <AdminStatsRow stats={stats} />

      {/* Tab switcher */}
      <div className="flex overflow-x-auto rounded-xl bg-cream p-1 gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`shrink-0 flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === t.id
                ? 'bg-warm-white text-charcoal shadow-sm'
                : 'text-muted hover:text-charcoal'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <section>
          <h2 className="mb-4 font-serif text-xl font-semibold text-charcoal">All Orders</h2>
          <OrdersTable initialOrders={orders} />
        </section>
      )}

      {/* ── MEALS ORDERED TAB ── */}
      {activeTab === 'meals-ordered' && (
        <div className="space-y-8">

          {/* Meal popularity summary */}
          <section>
            <h2 className="mb-4 font-serif text-xl font-semibold text-charcoal">Meal Popularity</h2>
            {mealStats.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white py-16 text-center">
                <div className="text-5xl mb-3">🍽️</div>
                <p className="text-sm text-muted">No meals ordered yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(45,74,62,0.12)] bg-cream text-left text-xs font-semibold uppercase tracking-wider text-muted">
                      <th className="px-4 py-3">Rank</th>
                      <th className="px-4 py-3">Meal</th>
                      <th className="px-4 py-3 text-right">Total Portions</th>
                      <th className="px-4 py-3 text-right">Orders Incl.</th>
                      <th className="px-4 py-3 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(45,74,62,0.08)]">
                    {mealStats.map((ms, i) => (
                      <tr key={ms.mealId} className="hover:bg-cream/50">
                        <td className="px-4 py-3 text-muted font-medium">#{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{ms.emoji}</span>
                            <span className="font-medium text-charcoal">{ms.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-bold text-forest">
                            ×{ms.totalQty}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-mid">{ms.orderCount}</td>
                        <td className="px-4 py-3 text-right font-medium text-charcoal">
                          KSh {ms.revenue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[rgba(45,74,62,0.15)] bg-cream">
                      <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-charcoal">Totals</td>
                      <td className="px-4 py-3 text-right font-bold text-charcoal">
                        ×{mealStats.reduce((s, m) => s + m.totalQty, 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-charcoal">
                        {orders.length}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-forest">
                        KSh {mealStats.reduce((s, m) => s + m.revenue, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>

          {/* Per-order breakdown */}
          <section>
            <h2 className="mb-4 font-serif text-xl font-semibold text-charcoal">Order-by-Order Breakdown</h2>
            {orders.length === 0 ? (
              <p className="text-sm text-muted">No orders yet.</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white overflow-hidden">
                    {/* Order header row — click to expand */}
                    <button
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-cream/40 transition-colors"
                    >
                      <span className="text-xs font-mono text-muted bg-cream px-2 py-0.5 rounded">
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                      <span className="flex-1 font-medium text-charcoal">{order.user?.name ?? '—'}</span>
                      <span className="text-xs text-muted hidden sm:block">
                        {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-xs font-semibold text-charcoal">
                        {order.items.reduce((s, i) => s + i.qty, 0)} portions
                      </span>
                      <span className="text-sm font-bold text-forest">KSh {order.total.toLocaleString()}</span>
                      <span className={`ml-1 text-muted transition-transform duration-200 ${expandedOrder === order.id ? 'rotate-180' : ''}`}>
                        ▾
                      </span>
                    </button>

                    {/* Expanded meal list */}
                    {expandedOrder === order.id && (
                      <div className="border-t border-[rgba(45,74,62,0.08)] divide-y divide-[rgba(45,74,62,0.06)]">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 px-5 py-3 bg-cream/30">
                            <span className="text-xl">{item.meal?.emoji ?? '🍽️'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-charcoal text-sm">{item.meal?.name ?? 'Unknown meal'}</p>
                              <p className="text-xs text-muted">
                                {item.meal?.cal ?? '—'} kcal · {item.meal?.pro ?? '—'}g protein
                              </p>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <span className="rounded-lg bg-forest/10 px-2.5 py-1 text-xs font-bold text-forest">
                                ×{item.qty}
                              </span>
                              <span className="text-sm font-semibold text-charcoal w-24 text-right">
                                KSh {item.linePrice.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                        {/* Order footer */}
                        <div className="flex justify-between items-center px-5 py-3 bg-cream/60">
                          <div className="flex gap-4 text-xs text-muted">
                            <span>📦 {order.status.replace(/_/g, ' ')}</span>
                            {order.deliveryAddress && <span>📍 {order.deliveryAddress}</span>}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted">Subtotal: KSh {order.subtotal.toLocaleString()} + Delivery: KSh {order.delivery.toLocaleString()}</p>
                            <p className="text-sm font-bold text-charcoal">Total: KSh {order.total.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── EMPLOYEES TAB ── */}
      {activeTab === 'employees' && (
        <div className="space-y-8">

          {/* Today's attendance board */}
          <section>
            <h2 className="mb-4 font-serif text-xl font-semibold text-charcoal">
              Today&apos;s Attendance — {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            {employees.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white py-14 text-center">
                <div className="text-4xl mb-2">👥</div>
                <p className="text-sm text-muted">No employees yet. Add one below.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(45,74,62,0.12)] bg-cream text-left text-xs font-semibold uppercase tracking-wider text-muted">
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Check In</th>
                      <th className="px-4 py-3">Check Out</th>
                      <th className="px-4 py-3">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(45,74,62,0.08)]">
                    {employees.map((emp) => {
                      const todayEntry = emp.timeEntries[0] ?? null
                      const isIn = todayEntry && !todayEntry.checkOut
                      return (
                        <tr key={emp.id} className="hover:bg-cream/40">
                          <td className="px-4 py-3">
                            <p className="font-medium text-charcoal">{emp.name}</p>
                            <p className="text-xs text-muted">{emp.email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              isIn ? 'bg-forest/10 text-forest' : todayEntry ? 'bg-cream text-muted' : 'bg-[rgba(196,98,45,0.08)] text-terracotta'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${isIn ? 'bg-forest' : todayEntry ? 'bg-muted' : 'bg-terracotta'}`} />
                              {isIn ? 'Checked In' : todayEntry ? 'Checked Out' : 'Not In'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-charcoal font-mono text-xs">
                            {todayEntry ? fmtTime(todayEntry.checkIn) : '—'}
                          </td>
                          <td className="px-4 py-3 text-charcoal font-mono text-xs">
                            {todayEntry?.checkOut ? fmtTime(todayEntry.checkOut) : isIn ? <span className="text-forest text-xs">Active</span> : '—'}
                          </td>
                          <td className="px-4 py-3 text-mid text-xs">
                            {todayEntry ? fmtDuration(todayEntry.checkIn, todayEntry.checkOut ?? null) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Add new employee */}
          <section>
            <h2 className="mb-4 font-serif text-xl font-semibold text-charcoal">Add New Employee</h2>
            <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-6 max-w-lg space-y-4">
              <Input label="Full Name" placeholder="e.g. Jane Doe" value={newEmpName} onChange={(e) => setNewEmpName(e.target.value)} />
              <Input label="Phone (optional)" type="tel" placeholder="e.g. 0712 345 678" value={newEmpPhone} onChange={(e) => setNewEmpPhone(e.target.value)} />
              <Button variant="primary" loading={empBusy} onClick={createEmployee}>Create Employee</Button>

              {/* Credentials reveal — shown once after creation */}
              {createdCreds && (
                <div className="rounded-xl border-2 border-forest bg-forest/5 p-4 space-y-2">
                  <p className="text-sm font-semibold text-forest">✅ Employee created — save these credentials now</p>
                  <p className="text-xs text-muted">These will not be shown again.</p>
                  <div className="rounded-lg bg-warm-white p-3 font-mono text-sm space-y-1">
                    <p><span className="text-muted">Email: </span><span className="text-charcoal font-medium">{createdCreds.email}</span></p>
                    <p><span className="text-muted">Password: </span><span className="text-charcoal font-medium">{createdCreds.password}</span></p>
                  </div>
                  <button onClick={() => setCreatedCreds(null)} className="text-xs text-muted hover:text-terracotta">Dismiss</button>
                </div>
              )}
            </div>
          </section>

          {/* All employees list */}
          {employees.length > 0 && (
            <section>
              <h2 className="mb-4 font-serif text-xl font-semibold text-charcoal">All Staff ({employees.length})</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {employees.map((emp) => {
                  const completedShifts = emp.timeEntries.filter((e) => e.checkOut).length
                  const totalMs = emp.timeEntries
                    .filter((e) => e.checkOut)
                    .reduce((s, e) => s + new Date(e.checkOut!).getTime() - new Date(e.checkIn).getTime(), 0)
                  const totalH = (totalMs / 3600000).toFixed(1)
                  return (
                    <div key={emp.id} className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest/10 font-serif text-lg font-bold text-forest">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-charcoal truncate">{emp.name}</p>
                          <p className="text-xs text-muted truncate">{emp.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-cream p-2 text-center">
                          <p className="font-bold text-charcoal">{completedShifts}</p>
                          <p className="text-muted">Shifts (today)</p>
                        </div>
                        <div className="rounded-lg bg-cream p-2 text-center">
                          <p className="font-bold text-charcoal">{totalH}h</p>
                          <p className="text-muted">Hours (today)</p>
                        </div>
                      </div>
                      {emp.phone && <p className="text-xs text-muted">📞 {emp.phone}</p>}
                      <p className="text-xs text-muted">
                        Added {new Date(emp.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── MEAL MANAGER TAB ── */}
      {activeTab === 'meal-manager' && (
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
      )}

      {/* ── SETTINGS TAB ── */}
      {activeTab === 'settings' && (
        <div className="space-y-10">

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

          {/* Coach Management */}
          <section>
            <h2 className="mb-4 font-serif text-xl font-semibold text-charcoal">Coach Management</h2>
            <div className="space-y-6">

              {/* Promote to coach */}
              <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-6 max-w-lg">
                <h3 className="mb-4 font-semibold text-charcoal">Promote User to Coach</h3>
                <div className="flex gap-3">
                  <select
                    value={promoteId}
                    onChange={(e) => setPromoteId(e.target.value)}
                    className="flex-1 rounded-lg border border-[rgba(45,74,62,0.25)] bg-cream px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest/30"
                  >
                    <option value="">— Select a customer —</option>
                    {customers.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                  <Button variant="primary" loading={coachBusy} onClick={promoteToCoach}>Promote</Button>
                </div>
              </div>

              {/* Assign client to coach */}
              <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-6 max-w-2xl">
                <h3 className="mb-4 font-semibold text-charcoal">Assign Client to Coach</h3>
                {coaches.length === 0 ? (
                  <p className="text-sm text-muted">No coaches yet. Promote a user to coach first.</p>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium text-muted">Client</label>
                      <select
                        value={assignClientId}
                        onChange={(e) => setAssignClientId(e.target.value)}
                        className="w-full rounded-lg border border-[rgba(45,74,62,0.25)] bg-cream px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest/30"
                      >
                        <option value="">— Select client —</option>
                        {customers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}{u.coach ? ` (currently: ${u.coach.name})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium text-muted">Coach</label>
                      <select
                        value={assignCoachId}
                        onChange={(e) => setAssignCoachId(e.target.value)}
                        className="w-full rounded-lg border border-[rgba(45,74,62,0.25)] bg-cream px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest/30"
                      >
                        <option value="">— Select coach —</option>
                        {coaches.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                        ))}
                      </select>
                    </div>
                    <Button variant="primary" loading={coachBusy} onClick={assignClientToCoach}>Assign</Button>
                  </div>
                )}
              </div>

              {/* Current coaches + their clients */}
              {coaches.length > 0 && (
                <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-6">
                  <h3 className="mb-4 font-semibold text-charcoal">Current Coaches ({coaches.length})</h3>
                  <div className="space-y-4">
                    {coaches.map((coach) => {
                      const coachClients = users.filter((u) => u.coachId === coach.id)
                      return (
                        <div key={coach.id} className="rounded-xl bg-cream p-4">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div>
                              <span className="font-semibold text-charcoal text-sm">{coach.name}</span>
                              <span className="ml-2 text-xs text-muted">{coach.email}</span>
                            </div>
                            <button
                              onClick={() => demoteCoach(coach.id)}
                              disabled={coachBusy}
                              className="text-xs text-terracotta hover:underline disabled:opacity-50"
                            >
                              Demote
                            </button>
                          </div>
                          {coachClients.length === 0 ? (
                            <p className="text-xs text-muted">No clients assigned</p>
                          ) : (
                            <ul className="space-y-1">
                              {coachClients.map((cl) => (
                                <li key={cl.id} className="flex items-center justify-between rounded-lg bg-warm-white px-3 py-1.5 text-xs">
                                  <span className="text-charcoal">{cl.name} <span className="text-muted">({cl.email})</span></span>
                                  <button
                                    onClick={() => unassignClient(cl.id)}
                                    disabled={coachBusy}
                                    className="text-muted hover:text-terracotta disabled:opacity-50"
                                  >
                                    ✕
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
