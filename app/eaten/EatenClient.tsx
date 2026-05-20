'use client'
import { useState, useEffect } from 'react'
import type { DayOfWeek, Meal, EatenLog } from '@/types'
import { useEatenStore } from '@/store/eatenStore'
import DaySelector from '@/components/eaten/DaySelector'
import EatenMealCard from '@/components/eaten/EatenMealCard'
import EatenSidebar from '@/components/eaten/EatenSidebar'
import WeekSummaryView from '@/components/eaten/WeekSummaryView'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/Toast'

interface Props {
  meals: Meal[]
  initialLogs: EatenLog[]
}

type View = 'daily' | 'week'

const currentDay = (): DayOfWeek => {
  const days: DayOfWeek[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  return days[new Date().getDay()]
}

export default function EatenClient({ meals, initialLogs }: Props) {
  const [day, setDay] = useState<DayOfWeek>(currentDay())
  const [view, setView] = useState<View>('daily')
  const { loadFromServer, getDayItems, setEaten } = useEatenStore()

  useEffect(() => { loadFromServer(initialLogs) }, [])

  const dayItems = getDayItems(day)

  async function handleLog(mealId: string, qty: number) {
    setEaten(day, mealId, qty)
    try {
      await api.put(`/api/eaten/${day}`, { mealId, qty })
    } catch {
      toast('Failed to sync log', 'error')
    }
  }

  async function removeMeal(mealId: string) {
    setEaten(day, mealId, 0)
    try {
      await api.put(`/api/eaten/${day}`, { mealId, qty: 0 })
    } catch {
      toast('Failed to remove', 'error')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-charcoal">Food Log</h1>
          <p className="mt-1 text-muted">Track what you eat each day</p>
        </div>
        <div className="flex rounded-lg bg-cream p-1">
          {(['daily', 'week'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${view === v ? 'bg-warm-white text-charcoal shadow-sm' : 'text-muted'}`}
            >
              {v === 'daily' ? 'Daily Log' : 'Week Summary'}
            </button>
          ))}
        </div>
      </div>

      {view === 'daily' ? (
        <>
          <div className="mb-6">
            <DaySelector active={day} onChange={setDay} />
          </div>
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex-1 min-w-0">
              <div className="grid gap-3 sm:grid-cols-2">
                {meals.map((m) => (
                  <EatenMealCard
                    key={m.id}
                    meal={m}
                    qty={dayItems[m.id] ?? 0}
                    onAdd={() => handleLog(m.id, (dayItems[m.id] ?? 0) + 1)}
                    onRemove={() => handleLog(m.id, Math.max(0, (dayItems[m.id] ?? 0) - 1))}
                  />
                ))}
              </div>
            </div>
            <div className="w-full lg:w-80 shrink-0">
              <EatenSidebar day={day} meals={meals} onRemoveMeal={(id) => removeMeal(id)} />
            </div>
          </div>
        </>
      ) : (
        <WeekSummaryView meals={meals} />
      )}
    </div>
  )
}
