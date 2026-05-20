'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { MacroTotals } from '@/types'

interface Props {
  totals: MacroTotals
}

export default function MacroDonutChart({ totals }: Props) {
  const { carb, pro, fat } = totals
  const total = carb + pro + fat || 1
  const data = [
    { name: 'Carbs', value: carb, pct: Math.round((carb / total) * 100), color: '#D4A853' },
    { name: 'Protein', value: pro, pct: Math.round((pro / total) * 100), color: '#2D4A3E' },
    { name: 'Fat', value: fat, pct: Math.round((fat / total) * 100), color: '#C4622D' },
  ]

  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={2}>
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip formatter={(v, name) => [`${v ?? 0}g`, name as string]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-charcoal font-medium">{d.name}</span>
            <span className="text-muted">{d.value}g · {d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
