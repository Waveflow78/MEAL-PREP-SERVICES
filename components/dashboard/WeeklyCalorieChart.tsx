'use client'
import type { DaySummary } from '@/types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { GOALS } from '@/lib/macros'

const SHORT: Record<string, string> = { MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun' }

interface Props {
  data: DaySummary[]
}

export default function WeeklyCalorieChart({ data }: Props) {
  const chartData = data.map((d) => ({ day: SHORT[d.day] ?? d.day, cal: d.cal }))
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip formatter={(v) => [`${v ?? 0} kcal`]} />
        <ReferenceLine y={GOALS.cal} stroke="#D4A853" strokeDasharray="4 2" />
        <Line type="monotone" dataKey="cal" stroke="#C4622D" strokeWidth={2.5} dot={{ r: 4, fill: '#C4622D' }} name="Calories" />
      </LineChart>
    </ResponsiveContainer>
  )
}
