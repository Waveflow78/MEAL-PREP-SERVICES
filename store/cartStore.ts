'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Meal, CartTotals } from '@/types'
import { computeCartTotals } from '@/lib/macros'

interface CartStore {
  items: Record<string, number>
  addItem: (mealId: string) => void
  removeItem: (mealId: string) => void
  setQty: (mealId: string, qty: number) => void
  clearCart: () => void
  getTotals: (meals: Meal[]) => CartTotals
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: {},
      addItem: (mealId) =>
        set((s) => ({ items: { ...s.items, [mealId]: (s.items[mealId] ?? 0) + 1 } })),
      removeItem: (mealId) =>
        set((s) => {
          const next = { ...s.items }
          if ((next[mealId] ?? 0) <= 1) delete next[mealId]
          else next[mealId]--
          return { items: next }
        }),
      setQty: (mealId, qty) =>
        set((s) => {
          const next = { ...s.items }
          if (qty <= 0) delete next[mealId]
          else next[mealId] = qty
          return { items: next }
        }),
      clearCart: () => set({ items: {} }),
      getTotals: (meals) => computeCartTotals(get().items, meals),
    }),
    { name: 'mali-cart', storage: createJSONStorage(() => sessionStorage) }
  )
)
