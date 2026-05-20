'use client'
import { create } from 'zustand'
import type { Meal, MacroTotals, EatenLog } from '@/types'
import { computeDayTotals } from '@/lib/macros'

interface EatenStore {
  log: Record<string, Record<string, number>>
  setEaten: (day: string, mealId: string, qty: number) => void
  getDayTotals: (day: string, meals: Meal[]) => MacroTotals
  getDayItems: (day: string) => Record<string, number>
  loadFromServer: (serverLogs: EatenLog[]) => void
  clearDay: (day: string) => void
}

export const useEatenStore = create<EatenStore>()((set, get) => ({
  log: {},
  setEaten: (day, mealId, qty) =>
    set((s) => {
      const dayLog = { ...s.log[day] }
      if (qty <= 0) delete dayLog[mealId]
      else dayLog[mealId] = qty
      return { log: { ...s.log, [day]: dayLog } }
    }),
  getDayTotals: (day, meals) => computeDayTotals(get().log[day] ?? {}, meals),
  getDayItems: (day) => get().log[day] ?? {},
  loadFromServer: (serverLogs) => {
    const log: Record<string, Record<string, number>> = {}
    for (const el of serverLogs) {
      log[el.day] = Object.fromEntries(el.items.map((i) => [i.mealId, i.qty]))
    }
    set({ log })
  },
  clearDay: (day) => set((s) => ({ log: { ...s.log, [day]: {} } })),
}))
