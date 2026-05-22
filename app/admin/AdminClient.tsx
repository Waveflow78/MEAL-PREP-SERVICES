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
}

export default function AdminClient({ orders, meals: initialMeals, stats, activeWeek, allUsers: initialUsers }: Props) {
  const [editMeal, setEditMeal] = useState<Meal | null>(null)
  const [meals, setMeals] = useState(initialMeals)
  const [weekNum, setWeekNum] = useState('')
  const [startDate, setStartDate] = useState('')
  const [savingWeek, setSavingWeek] = useState(false)

  // Coach management state
  const [users, setUsers] = useState<UserSummary[]>(initialUsers)
  const [promoteId, setPromoteId] = useState('')
  const [assignClientId, setAssignClientId] = useState('')
  const [assignCoachId, setAssignCoachId] = useState('')
  const [coachBusy, setCoachBusy] = useState(false)

  async function refreshMeals() {
    try {
      const updated = await api.get<Meal[]>('/api/admin/meals')
      setMeals(updated)
    } catch { /* silent */ }
  }

  async function refreshUsers() {
    try {
      const updated = await api.get<UserSummary[]>('/api/admin/coaches')
      setUsers(updated)
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

  async function promoteToCoach() {
    if (!promoteId) { toast('Select a user first', 'error'); return }
    setCoachBusy(true)
    try {
      await api.post('/api/admin/coaches', { action: 'promote', userId: promoteId })
      toast('User promoted to Coach')
      setPromoteId('')
      await refreshUsers()
    } catch {
      toast('Failed to promote user', 'error')
    } finally {
      setCoachBusy(false)
    }
  }

  async function demoteCoach(userId: string) {
    setCoachBusy(true)
    try {
      await api.post('/api/admin/coaches', { action: 'demote', userId })
      toast('Coach demoted to Customer')
      await refreshUsers()
    } catch {
      toast('Failed to demote coach', 'error')
    } finally {
      setCoachBusy(false)
    }
  }

  async function assignClientToCoach() {
    if (!assignClientId || !assignCoachId) { toast('Select both a client and a coach', 'error'); return }
    setCoachBusy(true)
    try {
      await api.post('/api/admin/coaches', { action: 'assign', clientId: assignClientId, coachId: assignCoachId })
      toast('Client assigned to coach')
      setAssignClientId('')
      setAssignCoachId('')
      await refreshUsers()
    } catch {
      toast('Failed to assign client', 'error')
    } finally {
      setCoachBusy(false)
    }
  }

  async function unassignClient(clientId: string) {
    setCoachBusy(true)
    try {
      await api.post('/api/admin/coaches', { action: 'unassign', clientId })
      toast('Client unassigned')
      await refreshUsers()
    } catch {
      toast('Failed to unassign client', 'error')
    } finally {
      setCoachBusy(false)
    }
  }

  const coaches = users.filter((u) => u.role === 'COACH')
  const customers = users.filter((u) => u.role === 'CUSTOMER')
  const promotable = users.filter((u) => u.role === 'CUSTOMER')

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
                {promotable.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <Button variant="primary" loading={coachBusy} onClick={promoteToCoach}>
                Promote
              </Button>
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
                <Button variant="primary" loading={coachBusy} onClick={assignClientToCoach}>
                  Assign
                </Button>
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
  )
}
