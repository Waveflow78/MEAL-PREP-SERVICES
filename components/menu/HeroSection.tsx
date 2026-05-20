'use client'
import type { Week } from '@/types'

interface Props {
  week: Week
  mealCount: number
  totalCal: number
  totalPro: number
}

function formatDateRange(startDate: string) {
  const start = new Date(startDate)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return `${start.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`
}

export default function HeroSection({ week, mealCount, totalCal, totalPro }: Props) {
  return (
    <section className="bg-forest px-4 py-10 md:py-14">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div className="flex-1">
          <h1 className="font-serif text-3xl font-bold leading-tight text-white md:text-4xl">
            This Week&apos;s <span className="text-gold-light">Fresh Menu</span>
            <br />Crafted for You
          </h1>
          <p className="mt-3 max-w-lg text-sm text-white/70">
            Every meal is nutritionist-designed, macro-tracked and delivered fresh. Select at least 10 meals to place an order.
          </p>

          {/* Live stats */}
          <div className="mt-6 flex flex-wrap gap-4">
            {[
              { label: 'Meals Selected', value: mealCount },
              { label: 'Total Calories', value: `${totalCal.toLocaleString()} kcal` },
              { label: 'Total Protein', value: `${totalPro}g` },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/10 px-4 py-2 text-center">
                <div className="text-xl font-bold text-gold-light">{s.value}</div>
                <div className="text-xs text-white/60">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Week badge */}
        <div className="rounded-2xl border border-white/20 bg-white/10 px-6 py-5 text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-white/60">Current Week</div>
          <div className="my-2 font-serif text-6xl font-bold text-gold-light">{week.weekNum}</div>
          <div className="text-sm text-white/70">{formatDateRange(week.startDate)}</div>
        </div>
      </div>
    </section>
  )
}
