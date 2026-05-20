'use client'
import { useState } from 'react'
import type { Meal } from '@/types'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/Toast'

interface Props {
  initialMeals: Meal[]
  onEdit: (meal: Meal) => void
  onDeleted: () => void
}

export default function MenuList({ initialMeals, onEdit, onDeleted }: Props) {
  const [meals, setMeals] = useState(initialMeals)

  async function deleteMeal(id: string) {
    if (!confirm('Delete this meal?')) return
    try {
      await api.delete(`/api/admin/meals/${id}`)
      setMeals((prev) => prev.filter((m) => m.id !== id))
      toast('Meal deleted')
      onDeleted()
    } catch {
      toast('Failed to delete', 'error')
    }
  }

  return (
    <div className="space-y-2 overflow-y-auto max-h-[520px] pr-1">
      {meals.map((m) => (
        <div key={m.id} className="flex items-center gap-3 rounded-xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-3">
          <span className="text-2xl">{m.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-charcoal truncate">{m.name}</div>
            <div className="text-xs text-muted">{m.cal} kcal · KSh {m.price.toLocaleString()}</div>
          </div>
          <button onClick={() => onEdit(m)} className="text-mid hover:text-forest px-1" title="Edit">✏️</button>
          <button onClick={() => deleteMeal(m.id)} className="text-mid hover:text-terracotta px-1" title="Delete">🗑️</button>
        </div>
      ))}
      {meals.length === 0 && <p className="py-6 text-center text-sm text-muted">No meals yet.</p>}
    </div>
  )
}
