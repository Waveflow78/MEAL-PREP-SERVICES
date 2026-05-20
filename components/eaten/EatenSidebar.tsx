'use client'
import type { DayOfWeek, Meal } from '@/types'
import { useEatenStore } from '@/store/eatenStore'
import { GOALS, pct } from '@/lib/macros'

const DAY_NAMES: Record<DayOfWeek, string> = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday' }

const goalBars = [
  { key: 'cal' as const, label: 'Calories', goal: GOALS.cal, unit: 'kcal', color: 'bg-terracotta' },
  { key: 'pro' as const, label: 'Protein', goal: GOALS.pro, unit: 'g', color: 'bg-forest' },
  { key: 'fib' as const, label: 'Fibre', goal: GOALS.fib, unit: 'g', color: 'bg-gold' },
  { key: 'carb' as const, label: 'Carbs', goal: GOALS.carb, unit: 'g', color: 'bg-[#8bc49a]' },
]

interface Props {
  day: DayOfWeek
  meals: Meal[]
  onRemoveMeal: (mealId: string) => void
}

export default function EatenSidebar({ day, meals, onRemoveMeal }: Props) {
  const { getDayTotals, getDayItems } = useEatenStore()
  const totals = getDayTotals(day, meals)
  const dayItems = getDayItems(day)
  const mealMap = Object.fromEntries(meals.map((m) => [m.id, m]))
  const logged = Object.entries(dayItems).filter(([, q]) => q > 0)

  return (
    <div className="space-y-4">
      <h3 className="font-serif text-lg font-semibold text-charcoal">{DAY_NAMES[day]}&apos;s Intake</h3>

      {/* Totals grid */}
      <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Today&apos;s Totals</h4>
        <div className="grid grid-cols-2 gap-2 text-center">
          {[
            { label: 'kcal', value: totals.cal.toLocaleString() },
            { label: 'protein', value: `${totals.pro}g` },
            { label: 'carbs', value: `${totals.carb}g` },
            { label: 'fibre', value: `${totals.fib}g` },
            { label: 'fat', value: `${totals.fat}g` },
            { label: 'sodium', value: `${totals.sod}mg` },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-cream px-2 py-2">
              <div className="text-base font-bold text-charcoal">{s.value}</div>
              <div className="text-xs text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Goal progress bars */}
      <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Goal Progress</h4>
        <div className="space-y-3">
          {goalBars.map((b) => {
            const val = totals[b.key]
            const p = pct(val, b.goal)
            return (
              <div key={b.key}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-mid">{b.label}</span>
                  <span className="text-muted">{val}{b.unit} / {b.goal}{b.unit}</span>
                </div>
                <div className="h-2 rounded-full bg-cream overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${b.color}`} style={{ width: `${p}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Logged meals */}
      {logged.length > 0 && (
        <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Meals Logged</h4>
          <div className="space-y-2">
            {logged.map(([mealId, qty]) => {
              const m = mealMap[mealId]
              if (!m) return null
              return (
                <div key={mealId} className="flex items-center gap-2 text-sm">
                  <span>{m.emoji}</span>
                  <span className="flex-1 truncate text-charcoal">{m.name}</span>
                  <span className="text-muted">×{qty}</span>
                  <button onClick={() => onRemoveMeal(mealId)} className="text-muted hover:text-terracotta">✕</button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
