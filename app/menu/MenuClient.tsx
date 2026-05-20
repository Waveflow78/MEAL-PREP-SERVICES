'use client'
import type { Meal, Week } from '@/types'
import { useCartStore } from '@/store/cartStore'
import HeroSection from '@/components/menu/HeroSection'
import MealGrid from '@/components/menu/MealGrid'
import OrderPanel from '@/components/menu/OrderPanel'

interface Props {
  meals: Meal[]
  week: Week
}

export default function MenuClient({ meals, week }: Props) {
  const { getTotals } = useCartStore()
  const totals = getTotals(meals)

  return (
    <>
      <HeroSection week={week} mealCount={totals.count} totalCal={totals.cal} totalPro={totals.pro} />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 min-w-0">
            <MealGrid meals={meals} />
          </div>
          <div className="w-full lg:w-80 shrink-0">
            <OrderPanel meals={meals} week={week} />
          </div>
        </div>
      </div>
    </>
  )
}
