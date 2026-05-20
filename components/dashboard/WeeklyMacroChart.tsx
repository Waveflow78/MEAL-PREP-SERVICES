'use client'
import type { DaySummary } from '@/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const SHORT: Record<string, string> = { MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun' }

interface Props {
  data: DaySummary[]
}

export default function WeeklyMacroChart({ data }: Props) {
  const chartData = data.map((d) => ({ day: SHORT[d.day] ?? d.day, pro: d.pro, fib: d.fib }))
  return (
    <>
      <div className="flex gap-4 mb-3 text-xs text-mid">
        <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-forest inline-block" />Protein (g)</span>
        <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-gold inline-block" />Fibre (g)</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} barSize={12} barGap={2}>
          <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip />
          <Bar dataKey="pro" fill="#2D4A3E" radius={[4, 4, 0, 0]} name="Protein (g)" />
          <Bar dataKey="fib" fill="#D4A853" radius={[4, 4, 0, 0]} name="Fibre (g)" />
        </BarChart>
      </ResponsiveContainer>
    </>
  )
}
