import type { Meal, MacroTotals, CartTotals } from '@/types'

export function computeCartTotals(items: Record<string, number>, meals: Meal[]): CartTotals {
  const mealMap = Object.fromEntries(meals.map((m) => [m.id, m]))
  let count = 0, cal = 0, pro = 0, carb = 0, fat = 0, fib = 0, sod = 0, price = 0
  for (const [mealId, qty] of Object.entries(items)) {
    const m = mealMap[mealId]
    if (!m || qty <= 0) continue
    count += qty
    cal += m.cal * qty
    pro += m.pro * qty
    carb += m.carb * qty
    fat += m.fat * qty
    fib += m.fib * qty
    sod += m.sod * qty
    price += m.price * qty
  }
  return { count, cal, pro, carb, fat, fib, sod, price }
}

export function computeDayTotals(items: Record<string, number>, meals: Meal[]): MacroTotals {
  const mealMap = Object.fromEntries(meals.map((m) => [m.id, m]))
  let cal = 0, pro = 0, carb = 0, fat = 0, fib = 0, sod = 0
  for (const [mealId, qty] of Object.entries(items)) {
    const m = mealMap[mealId]
    if (!m || qty <= 0) continue
    cal += m.cal * qty
    pro += m.pro * qty
    carb += m.carb * qty
    fat += m.fat * qty
    fib += m.fib * qty
    sod += m.sod * qty
  }
  return { cal, pro, carb, fat, fib, sod }
}

export const GOALS = { cal: 2000, pro: 150, carb: 250, fib: 30, fat: 65, sod: 2300 }

export function pct(value: number, goal: number) {
  return Math.min(100, Math.round((value / goal) * 100))
}
