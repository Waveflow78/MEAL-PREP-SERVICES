'use client'
import type { DayOfWeek } from '@/types'

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const LABELS: Record<DayOfWeek, string> = { MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun' }

interface Props {
  active: DayOfWeek
  onChange: (day: DayOfWeek) => void
}

export default function DaySelector({ active, onChange }: Props) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {DAYS.map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            active === d ? 'bg-forest text-white' : 'border border-[rgba(45,74,62,0.25)] text-mid hover:border-forest hover:text-forest'
          }`}
        >
          {LABELS[d]}
        </button>
      ))}
    </div>
  )
}
