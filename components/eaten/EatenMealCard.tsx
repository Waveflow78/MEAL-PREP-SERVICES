'use client'
import type { Meal } from '@/types'

interface Props {
  meal: Meal
  qty: number
  onAdd: () => void
  onRemove: () => void
}

export default function EatenMealCard({ meal, qty, onAdd, onRemove }: Props) {
  const logged = qty > 0

  return (
    <div className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${logged ? 'border-forest/30 bg-[#EEFAF6]' : 'border-[rgba(45,74,62,0.12)] bg-warm-white'}`}>
      <div className="text-2xl">{meal.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-charcoal truncate">{meal.name}</div>
        <div className="text-xs text-muted">{meal.cal} kcal · {meal.pro}g protein · {meal.fib}g fibre</div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={onRemove} disabled={qty === 0} className="flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(45,74,62,0.25)] text-xs text-mid hover:bg-forest hover:text-white disabled:opacity-30 transition-colors">−</button>
        <span className="w-4 text-center text-sm font-medium text-charcoal">{qty}</span>
        <button onClick={onAdd} className="flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(45,74,62,0.25)] text-xs text-mid hover:bg-forest hover:text-white transition-colors">+</button>
      </div>

      <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${logged ? 'border-forest bg-forest text-white' : 'border-[rgba(45,74,62,0.25)]'}`}>
        {logged && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
      </div>
    </div>
  )
}
