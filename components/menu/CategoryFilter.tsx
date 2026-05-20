'use client'
import type { MealCategory } from '@/types'

const filters: { label: string; value: MealCategory | 'ALL' }[] = [
  { label: 'All Meals', value: 'ALL' },
  { label: 'High Protein', value: 'HIGH_PROTEIN' },
  { label: 'Low Calorie', value: 'LOW_CALORIE' },
  { label: 'High Fibre', value: 'HIGH_FIBRE' },
  { label: 'Vegetarian', value: 'VEGETARIAN' },
  { label: 'Balanced', value: 'BALANCED' },
]

interface Props {
  active: MealCategory | 'ALL'
  onChange: (val: MealCategory | 'ALL') => void
}

export default function CategoryFilter({ active, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            active === f.value
              ? 'bg-forest text-white'
              : 'border border-forest text-forest hover:bg-forest/10'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
