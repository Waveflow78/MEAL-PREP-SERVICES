'use client'
import { useState, useEffect } from 'react'
import type { Meal, EatenLog, DayOfWeek } from '@/types'
import { useEatenStore } from '@/store/eatenStore'
import { GOALS, pct } from '@/lib/macros'
import StatCard from '@/components/dashboard/StatCard'
import RingChart from '@/components/dashboard/RingChart'
import TodayBreakdownChart from '@/components/dashboard/TodayBreakdownChart'
import WeeklyCalorieChart from '@/components/dashboard/WeeklyCalorieChart'
import WeeklyMacroChart from '@/components/dashboard/WeeklyMacroChart'
import MacroDonutChart from '@/components/dashboard/MacroDonutChart'

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const SHORT: Record<DayOfWeek, string> = { MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun' }

function todayKey(): DayOfWeek {
  const days: DayOfWeek[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  return days[new Date().getDay()]
}

interface Props {
  meals: Meal[]
  initialLogs: EatenLog[]
}

export default function DashboardClient({ meals, initialLogs }: Props) {
  const [tab, setTab] = useState<'today' | 'week'>('today')
  const { loadFromServer, getDayTotals } = useEatenStore()

  useEffect(() => { loadFromServer(initialLogs) }, [])

  const today = todayKey()
  const todayTotals = getDayTotals(today, meals)
  const { getDayItems } = useEatenStore()
  const todayItems = getDayItems(today)

  const weekData = DAYS.map((d) => ({ ...getDayTotals(d, meals), day: d, mealCount: 0 }))
  const weekTotals = weekData.reduce((acc, d) => ({
    cal: acc.cal + d.cal, pro: acc.pro + d.pro,
    carb: acc.carb + d.carb, fat: acc.fat + d.fat,
    fib: acc.fib + d.fib, sod: acc.sod + d.sod,
  }), { cal: 0, pro: 0, carb: 0, fat: 0, fib: 0, sod: 0 })

  const weekMeals = weekData.reduce((s, d) => {
    const items = useEatenStore.getState().getDayItems(d.day)
    return s + Object.values(items).reduce((a, q) => a + q, 0)
  }, 0)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-serif text-3xl font-bold text-charcoal">Dashboard</h1>
        <div className="flex rounded-lg bg-cream p-1">
          {(['today', 'week'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-5 py-1.5 text-sm font-medium transition-colors ${tab === t ? 'bg-warm-white text-charcoal shadow-sm' : 'text-muted'}`}
            >
              {t === 'today' ? 'Today' : 'This Week'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'today' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Calories" value={`${todayTotals.cal.toLocaleString()} kcal`} goal={`Goal: ${GOALS.cal.toLocaleString()} kcal`} highlight />
            <StatCard label="Protein" value={`${todayTotals.pro}g`} goal={`Goal: ${GOALS.pro}g`} />
            <StatCard label="Fibre" value={`${todayTotals.fib}g`} goal={`Goal: ${GOALS.fib}g`} />
            <StatCard label="Carbohydrates" value={`${todayTotals.carb}g`} goal={`Goal: ${GOALS.carb}g`} />
          </div>

          <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-6">
            <h2 className="mb-6 font-semibold text-charcoal">Today&apos;s Progress</h2>
            <div className="flex flex-wrap justify-center gap-10">
              <RingChart value={pct(todayTotals.cal, GOALS.cal)} color="#C4622D" size={100} label="Calories" subtitle={`${todayTotals.cal}/${GOALS.cal} kcal`} />
              <RingChart value={pct(todayTotals.pro, GOALS.pro)} color="#2D4A3E" size={100} label="Protein" subtitle={`${todayTotals.pro}/${GOALS.pro}g`} />
              <RingChart value={pct(todayTotals.fib, GOALS.fib)} color="#D4A853" size={100} label="Fibre" subtitle={`${todayTotals.fib}/${GOALS.fib}g`} />
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-6">
            <h2 className="mb-4 font-semibold text-charcoal">Today&apos;s Meals — Calories & Protein</h2>
            <TodayBreakdownChart meals={meals} dayItems={todayItems} />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Weekly Calories" value={`${weekTotals.cal.toLocaleString()} kcal`} highlight />
            <StatCard label="Total Protein" value={`${weekTotals.pro}g`} />
            <StatCard label="Total Fibre" value={`${weekTotals.fib}g`} />
            <StatCard label="Meals Consumed" value={weekMeals} />
          </div>

          <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-6">
            <h2 className="mb-4 font-semibold text-charcoal">Daily Calorie Intake</h2>
            <WeeklyCalorieChart data={weekData} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-6">
              <h2 className="mb-4 font-semibold text-charcoal">Protein & Fibre per Day</h2>
              <WeeklyMacroChart data={weekData} />
            </div>
            <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-6">
              <h2 className="mb-4 font-semibold text-charcoal">Macronutrient Split</h2>
              <MacroDonutChart totals={weekTotals} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
