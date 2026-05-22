'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Meal, EatenLog, DayOfWeek } from '@/types'
import { GOALS, pct } from '@/lib/macros'
import RingChart from '@/components/dashboard/RingChart'
import WeeklyCalorieChart from '@/components/dashboard/WeeklyCalorieChart'
import WeeklyMacroChart from '@/components/dashboard/WeeklyMacroChart'
import MacroDonutChart from '@/components/dashboard/MacroDonutChart'

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const DAY_LABEL: Record<DayOfWeek, string> = { MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun' }

interface Client { id: string; name: string; email: string; phone: string | null; createdAt: Date | string }

interface Props {
  client: Client
  meals: Meal[]
  logs: EatenLog[]
  weekNum: number | null
}

function todayKey(): DayOfWeek {
  const days: DayOfWeek[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  return days[new Date().getDay()]
}

function computeDayTotals(log: EatenLog | undefined, meals: Meal[]) {
  const mealMap = Object.fromEntries(meals.map((m) => [m.id, m]))
  let cal = 0, pro = 0, carb = 0, fat = 0, fib = 0, sod = 0
  if (log) {
    for (const item of log.items) {
      const m = mealMap[item.mealId]
      if (!m) continue
      cal  += m.cal  * item.qty
      pro  += m.pro  * item.qty
      carb += m.carb * item.qty
      fat  += m.fat  * item.qty
      fib  += m.fib  * item.qty
      sod  += m.sod  * item.qty
    }
  }
  return { cal, pro, carb, fat, fib, sod }
}

export default function ClientView({ client, meals, logs, weekNum }: Props) {
  const [tab, setTab] = useState<'today' | 'week' | 'log'>('today')
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayKey())

  const logByDay = Object.fromEntries(logs.map((l) => [l.day, l])) as Record<DayOfWeek, EatenLog | undefined>
  const mealMap = Object.fromEntries(meals.map((m) => [m.id, m]))

  const todayTotals = computeDayTotals(logByDay[todayKey()], meals)
  const selectedDayTotals = computeDayTotals(logByDay[selectedDay], meals)

  const weekData = DAYS.map((d) => ({ ...computeDayTotals(logByDay[d], meals), day: d, mealCount: 0 }))
  const weekTotals = weekData.reduce((acc, d) => ({
    cal: acc.cal + d.cal, pro: acc.pro + d.pro,
    carb: acc.carb + d.carb, fat: acc.fat + d.fat,
    fib: acc.fib + d.fib, sod: acc.sod + d.sod,
  }), { cal: 0, pro: 0, carb: 0, fat: 0, fib: 0, sod: 0 })

  const logsWithItems = logs.filter((l) => l.items.length > 0)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Back */}
      <Link href="/coach" className="mb-6 inline-flex items-center gap-1.5 text-sm text-mid hover:text-forest">
        ← Back to clients
      </Link>

      {/* Client header */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-5 sm:flex-row sm:items-center">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-forest/10 font-serif text-2xl font-bold text-forest">
          {client.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-2xl font-bold text-charcoal">{client.name}</h1>
          <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted">
            <span>✉️ {client.email}</span>
            {client.phone && <span>📞 {client.phone}</span>}
            {weekNum && <span>📅 Week {weekNum}</span>}
            <span>🗓 Member since {new Date(client.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
        <div className="shrink-0 rounded-xl bg-cream px-4 py-2 text-center">
          <p className="text-2xl font-bold text-forest">{logsWithItems.length}</p>
          <p className="text-xs text-muted">days logged</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="mb-6 flex rounded-lg bg-cream p-1">
        {([['today', 'Today'], ['week', 'This Week'], ['log', 'Food Log']] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${tab === t ? 'bg-warm-white text-charcoal shadow-sm' : 'text-muted hover:text-charcoal'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TODAY */}
      {tab === 'today' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'Calories', value: `${todayTotals.cal.toLocaleString()} kcal`, goal: `Goal: ${GOALS.cal.toLocaleString()}` },
              { label: 'Protein',  value: `${todayTotals.pro}g`,  goal: `Goal: ${GOALS.pro}g` },
              { label: 'Fibre',    value: `${todayTotals.fib}g`,  goal: `Goal: ${GOALS.fib}g` },
              { label: 'Carbs',    value: `${todayTotals.carb}g`, goal: `Goal: ${GOALS.carb}g` },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-4">
                <p className="text-xs font-medium text-muted">{s.label}</p>
                <p className="mt-1 text-xl font-bold text-charcoal">{s.value}</p>
                <p className="text-xs text-muted">{s.goal}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-6">
            <h2 className="mb-6 font-semibold text-charcoal">Today&apos;s Progress</h2>
            <div className="flex flex-wrap justify-center gap-10">
              <RingChart value={pct(todayTotals.cal, GOALS.cal)} color="#C4622D" size={100} label="Calories" subtitle={`${todayTotals.cal}/${GOALS.cal} kcal`} />
              <RingChart value={pct(todayTotals.pro, GOALS.pro)} color="#2D4A3E" size={100} label="Protein"  subtitle={`${todayTotals.pro}/${GOALS.pro}g`} />
              <RingChart value={pct(todayTotals.fib, GOALS.fib)} color="#D4A853" size={100} label="Fibre"    subtitle={`${todayTotals.fib}/${GOALS.fib}g`} />
            </div>
          </div>
        </div>
      )}

      {/* WEEK */}
      {tab === 'week' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'Weekly Calories', value: `${weekTotals.cal.toLocaleString()} kcal` },
              { label: 'Total Protein',   value: `${weekTotals.pro}g` },
              { label: 'Total Fibre',     value: `${weekTotals.fib}g` },
              { label: 'Days Logged',     value: logsWithItems.length },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-4">
                <p className="text-xs font-medium text-muted">{s.label}</p>
                <p className="mt-1 text-xl font-bold text-charcoal">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-6">
            <h2 className="mb-4 font-semibold text-charcoal">Daily Calorie Intake</h2>
            <WeeklyCalorieChart data={weekData} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-6">
              <h2 className="mb-4 font-semibold text-charcoal">Protein &amp; Fibre per Day</h2>
              <WeeklyMacroChart data={weekData} />
            </div>
            <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-6">
              <h2 className="mb-4 font-semibold text-charcoal">Macronutrient Split</h2>
              <MacroDonutChart totals={weekTotals} />
            </div>
          </div>
        </div>
      )}

      {/* FOOD LOG */}
      {tab === 'log' && (
        <div className="space-y-4">
          {/* Day selector */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {DAYS.map((d) => {
              const hasLog = (logByDay[d]?.items.length ?? 0) > 0
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`shrink-0 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                    selectedDay === d
                      ? 'bg-forest text-white'
                      : hasLog
                      ? 'bg-forest/10 text-forest hover:bg-forest/20'
                      : 'bg-cream text-muted hover:bg-cream/80'
                  }`}
                >
                  {DAY_LABEL[d]}
                  {hasLog && <span className="ml-1">•</span>}
                </button>
              )
            })}
          </div>

          {/* Day totals */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {[
              { label: 'kcal', value: selectedDayTotals.cal.toLocaleString() },
              { label: 'protein', value: `${selectedDayTotals.pro}g` },
              { label: 'carbs', value: `${selectedDayTotals.carb}g` },
              { label: 'fat', value: `${selectedDayTotals.fat}g` },
              { label: 'fibre', value: `${selectedDayTotals.fib}g` },
              { label: 'sodium', value: `${selectedDayTotals.sod}mg` },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-cream p-2.5 text-center">
                <p className="font-semibold text-charcoal text-sm">{s.value}</p>
                <p className="text-xs text-muted">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Logged meals */}
          {(logByDay[selectedDay]?.items.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white py-14 text-center">
              <div className="text-4xl mb-3">🍽️</div>
              <p className="text-sm text-muted">No meals logged for {DAY_LABEL[selectedDay]}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white divide-y divide-[rgba(45,74,62,0.08)]">
              {logByDay[selectedDay]!.items.map((item) => {
                const m = mealMap[item.mealId]
                if (!m) return null
                return (
                  <div key={item.id} className="flex items-center gap-3 p-4">
                    <span className="text-2xl">{m.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-charcoal truncate">{m.name}</p>
                      <p className="text-xs text-muted">{m.cal * item.qty} kcal · {m.pro * item.qty}g protein</p>
                    </div>
                    <div className="shrink-0 rounded-lg bg-cream px-2.5 py-1 text-xs font-semibold text-charcoal">
                      ×{item.qty}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
