'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import type { Meal, Week } from '@/types'
import { useCartStore } from '@/store/cartStore'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import AuthForm from '@/components/auth/AuthForm'

interface Props {
  meals: Meal[]
  week: Week
}

export default function OrderPanel({ meals, week }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const { items, clearCart, getTotals } = useCartStore()
  const [placing, setPlacing] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)

  const totals = getTotals(meals)
  const MIN = 10
  const canOrder = totals.count >= MIN
  const selected = meals.filter((m) => (items[m.id] ?? 0) > 0)

  async function placeOrder() {
    if (!session) { setAuthOpen(true); return }
    setPlacing(true)
    try {
      await api.post('/api/orders', {
        items: Object.entries(items).filter(([, q]) => q > 0).map(([mealId, qty]) => ({ mealId, qty })),
      })
      clearCart()
      toast('Order placed successfully!')
      router.push('/orders')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to place order', 'error')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <>
      <div className="sticky top-20 flex h-[calc(100vh-5rem)] flex-col rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-5 shadow-sm">
        <h2 className="font-serif text-lg font-semibold text-charcoal">Your Order</h2>
        <p className="text-xs text-muted">Week {week.weekNum}</p>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-mid mb-1">
            <span>{totals.count} meals selected</span>
            <span>min. {MIN}</span>
          </div>
          <div className="h-2 rounded-full bg-cream overflow-hidden">
            <div
              className="h-full rounded-full bg-terracotta transition-all duration-300"
              style={{ width: `${Math.min(100, (totals.count / MIN) * 100)}%` }}
            />
          </div>
        </div>

        {/* Selected items */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2 min-h-0">
          {selected.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Add meals to get started</p>
          ) : (
            selected.map((m) => (
              <div key={m.id} className="flex items-center gap-2 text-sm">
                <span>{m.emoji}</span>
                <span className="flex-1 truncate text-charcoal">{m.name}</span>
                <span className="text-muted">×{items[m.id]}</span>
                <span className="font-medium text-charcoal">
                  KSh {((items[m.id] ?? 0) * m.price).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        {canOrder && (
          <div className="mt-4 rounded-xl bg-cream p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-mid">
              <span>Subtotal</span><span>KSh {totals.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-mid">
              <span>Delivery</span><span>KSh 200</span>
            </div>
            <div className="flex justify-between font-semibold text-charcoal border-t border-[rgba(45,74,62,0.12)] pt-1.5 mt-1.5">
              <span>Total</span><span>KSh {(totals.price + 200).toLocaleString()}</span>
            </div>
            {/* Macro grid */}
            <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-[rgba(45,74,62,0.12)] pt-3 text-xs text-center">
              {[
                { label: 'kcal', value: totals.cal.toLocaleString() },
                { label: 'protein', value: `${totals.pro}g` },
                { label: 'fibre', value: `${totals.fib}g` },
                { label: 'carbs', value: `${totals.carb}g` },
                { label: 'fat', value: `${totals.fat}g` },
                { label: 'sodium', value: `${totals.sod}mg` },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-warm-white p-1.5">
                  <div className="font-semibold text-charcoal">{s.value}</div>
                  <div className="text-muted">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!canOrder && totals.count > 0 && (
          <div className="mt-4 rounded-xl bg-terracotta/10 p-3 text-xs text-terracotta">
            Add {MIN - totals.count} more meal{MIN - totals.count !== 1 ? 's' : ''} to meet the minimum
          </div>
        )}

        <Button
          variant="terracotta"
          size="lg"
          className="mt-4 w-full"
          disabled={!canOrder}
          loading={placing}
          onClick={placeOrder}
        >
          Place Order
        </Button>
      </div>

      <Modal open={authOpen} onClose={() => setAuthOpen(false)} title="Sign in to Order">
        <AuthForm onSuccess={() => setAuthOpen(false)} />
      </Modal>
    </>
  )
}
