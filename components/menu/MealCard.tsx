'use client'
import type { Meal } from '@/types'

const catBg: Record<string, string> = {
  HIGH_PROTEIN: '#EEF7F4',
  LOW_CALORIE: '#FFF9F5',
  HIGH_FIBRE: '#F8F4E8',
  VEGETARIAN: '#F0F8ED',
  BALANCED: '#F5F0F9',
}

interface Props {
  meal: Meal
  qty: number
  onAdd: () => void
  onRemove: () => void
}

export default function MealCard({ meal, qty, onAdd, onRemove }: Props) {
  const selected = qty > 0

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-2xl bg-warm-white transition-all duration-200 ${
        selected
          ? 'ring-2 ring-forest shadow-[0_0_0_4px_rgba(45,74,62,0.12)]'
          : 'border border-[rgba(45,74,62,0.12)] hover:border-[rgba(45,74,62,0.25)]'
      }`}
    >
      {/* Emoji panel */}
      <div
        className="flex h-24 items-center justify-center text-4xl"
        style={{ backgroundColor: catBg[meal.cat] ?? '#F5F5F5' }}
      >
        {meal.emoji}
      </div>

      {/* Badges */}
      {meal.badge && (
        <span
          className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-xs font-semibold text-white ${
            meal.badge === 'Popular' ? 'bg-forest' : 'bg-terracotta'
          }`}
        >
          {meal.badge}
        </span>
      )}

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-serif text-base font-semibold text-charcoal">{meal.name}</h3>
        <p className="mt-1 text-xs text-muted">{meal.desc}</p>

        {/* Macro pills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-cream px-2 py-0.5 text-xs text-mid">🔥 {meal.cal} kcal</span>
          <span className="rounded-full bg-cream px-2 py-0.5 text-xs text-mid">💪 {meal.pro}g protein</span>
          <span className="rounded-full bg-cream px-2 py-0.5 text-xs text-mid">🌿 {meal.fib}g fibre</span>
        </div>

        {/* Price & controls */}
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="font-semibold text-charcoal">KSh {meal.price.toLocaleString()}</span>

          <div className="flex items-center gap-2">
            <button
              onClick={onRemove}
              disabled={qty === 0}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(45,74,62,0.25)] text-mid transition-colors hover:bg-forest hover:text-white disabled:opacity-30"
            >
              −
            </button>
            <span className="w-5 text-center text-sm font-medium text-charcoal">{qty}</span>
            <button
              onClick={onAdd}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(45,74,62,0.25)] text-mid transition-colors hover:bg-forest hover:text-white"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
