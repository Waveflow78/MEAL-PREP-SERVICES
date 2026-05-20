'use client'
import type { DayOfWeek, Meal } from '@/types'
import { useEatenStore } from '@/store/eatenStore'
import { GOALS } from '@/lib/macros'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const SHORT: Record<DayOfWeek, string> = { MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun' }

interface Props {
  meals: Meal[]
}

export default function WeekSummaryView({ meals }: Props) {
  const { getDayTotals } = useEatenStore()
  const data = DAYS.map((d) => {
    const t = getDayTotals(d, meals)
    return { day: SHORT[d], cal: t.cal, pro: t.pro, fib: t.fib }
  })

  return (
    <div className="space-y-6">
      {/* Mini rows */}
      <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-5">
        <h3 className="mb-4 font-semibold text-charcoal">Weekly Overview</h3>
        <div className="space-y-3">
          {DAYS.map((d) => {
            const t = getDayTotals(d, meals)
            const calPct = Math.min(100, (t.cal / GOALS.cal) * 100)
            const proPct = Math.min(100, (t.pro / GOALS.pro) * 100)
            const fibPct = Math.min(100, (t.fib / GOALS.fib) * 100)
            return (
              <div key={d} className="grid grid-cols-[60px_1fr_1fr_1fr] items-center gap-3 text-xs">
                <span className="font-medium text-mid">{SHORT[d]}</span>
                {[{ pct: calPct, label: `${t.cal}kcal`, color: 'bg-terracotta' }, { pct: proPct, label: `${t.pro}g`, color: 'bg-forest' }, { pct: fibPct, label: `${t.fib}g fib`, color: 'bg-gold' }].map((b, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 rounded-full bg-cream overflow-hidden">
                      <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.pct}%` }} />
                    </div>
                    <span className="text-muted w-12 text-right">{b.label}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Calorie chart */}
      <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-5">
        <h3 className="mb-4 font-semibold text-charcoal">Calories vs Goal</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} barSize={20}>
            <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip formatter={(v) => [`${v ?? 0} kcal`]} />
            <ReferenceLine y={GOALS.cal} stroke="#D4A853" strokeDasharray="4 2" label={{ value: 'Goal', position: 'right', fontSize: 10 }} />
            <Bar dataKey="cal" fill="#C4622D" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Protein & Fibre chart */}
      <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-5">
        <h3 className="mb-4 font-semibold text-charcoal">Protein & Fibre</h3>
        <div className="flex gap-4 mb-3 text-xs text-mid">
          <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-forest inline-block" />Protein</span>
          <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-gold inline-block" />Fibre</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} barSize={12} barGap={2}>
            <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip />
            <Bar dataKey="pro" fill="#2D4A3E" radius={[4, 4, 0, 0]} name="Protein (g)" />
            <Bar dataKey="fib" fill="#D4A853" radius={[4, 4, 0, 0]} name="Fibre (g)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
