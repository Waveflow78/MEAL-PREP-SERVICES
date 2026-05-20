'use client'
import type { Meal } from '@/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  meals: Meal[]
  dayItems: Record<string, number>
}

export default function TodayBreakdownChart({ meals, dayItems }: Props) {
  const data = meals
    .filter((m) => (dayItems[m.id] ?? 0) > 0)
    .map((m) => ({ name: m.name.split(' ').slice(0, 2).join(' '), cal: m.cal * (dayItems[m.id] ?? 0), pro: m.pro * (dayItems[m.id] ?? 0) }))

  if (data.length === 0) return <p className="py-8 text-center text-sm text-muted">No meals logged today.</p>

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={16} barGap={4}>
        <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip />
        <Bar dataKey="cal" fill="#C4622D" radius={[4, 4, 0, 0]} name="Calories" />
        <Bar dataKey="pro" fill="#2D4A3E" radius={[4, 4, 0, 0]} name="Protein (g)" />
      </BarChart>
    </ResponsiveContainer>
  )
}
