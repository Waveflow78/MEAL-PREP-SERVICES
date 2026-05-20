'use client'
import type { Meal, MealCategory } from '@/types'
import { useCartStore } from '@/store/cartStore'
import MealCard from './MealCard'
import { useState } from 'react'
import CategoryFilter from './CategoryFilter'

interface Props {
  meals: Meal[]
}

export default function MealGrid({ meals }: Props) {
  const { items, addItem, removeItem } = useCartStore()
  const [category, setCategory] = useState<MealCategory | 'ALL'>('ALL')

  const filtered = category === 'ALL' ? meals : meals.filter((m) => m.cat === category)

  return (
    <div>
      <div className="mb-5">
        <CategoryFilter active={category} onChange={setCategory} />
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {filtered.map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            qty={items[meal.id] ?? 0}
            onAdd={() => addItem(meal.id)}
            onRemove={() => removeItem(meal.id)}
          />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="py-12 text-center text-muted">No meals in this category this week.</p>
      )}
    </div>
  )
}
