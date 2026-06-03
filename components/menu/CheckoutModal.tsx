'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Meal, Week } from '@/types'
import { useCartStore } from '@/store/cartStore'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import AddressPicker, { type PickedLocation } from '@/components/ui/AddressPicker'

interface Props {
  open: boolean
  onClose: () => void
  meals: Meal[]
  week: Week
}

type Step = 'form' | 'waiting' | 'success' | 'failed'

export default function CheckoutModal({ open, onClose, meals, week }: Props) {
  const router = useRouter()
  const { items, clearCart, getTotals } = useCartStore()
  const totals = getTotals(meals)
  const total  = totals.price + 200

  const [step,     setStep]     = useState<Step>('form')
  const [location, setLocation] = useState<PickedLocation | null>(null)
  const [notes,    setNotes]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [orderId,  setOrderId]  = useState<string | null>(null)
  const [mpesaCode,setMpesaCode]= useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (open) { setStep('form'); setOrderId(null); setMpesaCode(null) }
  }, [open])

  // Poll payment status
  useEffect(() => {
    if (step !== 'waiting' || !orderId) return

    pollRef.current = setInterval(async () => {
      try {
        const data = await api.get<{ paymentStatus: string; mpesaCode?: string }>(`/api/mpesa/status?orderId=${orderId}`)
        if (data.paymentStatus === 'PAID') {
          clearInterval(pollRef.current!)
          setMpesaCode(data.mpesaCode ?? null)
          setStep('success')
        } else if (data.paymentStatus === 'FAILED') {
          clearInterval(pollRef.current!)
          setStep('failed')
        }
      } catch { /* keep polling */ }
    }, 3000)

    const timeout = setTimeout(() => {
      clearInterval(pollRef.current!)
      if (step === 'waiting') setStep('failed')
    }, 180_000)

    return () => { clearInterval(pollRef.current!); clearTimeout(timeout) }
  }, [step, orderId, clearCart])

  async function handlePay() {
    if (!location?.address?.trim()) { toast('Please select a delivery address', 'error'); return }
    if (!phone.trim())              { toast('Please enter your M-Pesa phone number', 'error'); return }
    setLoading(true)
    try {
      const res = await api.post<{ orderId: string; devMode?: boolean }>('/api/mpesa/initiate', {
        items: Object.entries(items).filter(([, q]) => q > 0).map(([mealId, qty]) => ({ mealId, qty })),
        deliveryAddress: location.address,
        deliveryLat:  location.lat  || undefined,
        deliveryLng:  location.lng  || undefined,
        deliveryNotes: notes.trim() || undefined,
        mpesaPhone: phone,
      })
      setOrderId(res.orderId)
      if (res.devMode) {
        setMpesaCode('DEV_MODE')
        setStep('success')
      } else {
        setStep('waiting')
        toast('Check your phone for the M-Pesa prompt!')
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Payment failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleSuccess() {
    clearCart()
    onClose()
    router.push('/orders')
  }

  const selected = meals.filter((m) => (items[m.id] ?? 0) > 0)

  return (
    <Modal open={open} onClose={step === 'waiting' ? undefined : onClose} title="Checkout">

      {/* ORDER SUMMARY */}
      <div className="mb-4 max-h-36 overflow-y-auto rounded-xl bg-cream p-3 space-y-1 text-sm">
        {selected.map((m) => (
          <div key={m.id} className="flex justify-between text-mid">
            <span>{m.emoji} {m.name} ×{items[m.id]}</span>
            <span>KSh {((items[m.id] ?? 0) * m.price).toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between text-mid border-t border-[rgba(45,74,62,0.12)] pt-1 mt-1">
          <span>Delivery</span><span>KSh 200</span>
        </div>
        <div className="flex justify-between font-bold text-charcoal text-base pt-1 border-t border-[rgba(45,74,62,0.12)]">
          <span>Total</span><span>KSh {total.toLocaleString()}</span>
        </div>
      </div>

      {/* STEP: FORM */}
      {step === 'form' && (
        <div className="space-y-3">

          {/* Address picker — GPS + autocomplete + map */}
          <AddressPicker value={location} onChange={setLocation} label="Delivery Address" />

          {/* Delivery notes */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-mid">
              Delivery Notes <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Blue gate, call when you arrive, leave with security…"
              rows={2}
              className="w-full resize-none rounded-lg border border-[rgba(45,74,62,0.25)] bg-warm-white px-3 py-2.5 text-sm text-charcoal placeholder:text-muted focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest/20"
            />
          </div>

          {/* M-Pesa phone */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-mid">M-Pesa Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0712 345 678"
              className="w-full rounded-lg border border-[rgba(45,74,62,0.25)] bg-warm-white px-3 py-2.5 text-sm text-charcoal placeholder:text-muted focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest/20"
            />
          </div>

          <p className="text-xs text-muted">
            You will receive a push notification on your phone to confirm payment of{' '}
            <strong className="text-charcoal">KSh {total.toLocaleString()}</strong>.
          </p>

          <Button variant="terracotta" size="lg" className="w-full" loading={loading} onClick={handlePay}>
            🔒 Pay KSh {total.toLocaleString()} via M-Pesa
          </Button>
        </div>
      )}

      {/* STEP: WAITING */}
      {step === 'waiting' && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-forest/20" />
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-forest border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-xl">📱</div>
          </div>
          <div>
            <p className="font-semibold text-charcoal">Check your phone!</p>
            <p className="mt-1 text-sm text-muted">
              Enter your M-Pesa PIN to confirm{' '}
              <strong className="text-charcoal">KSh {total.toLocaleString()}</strong>.
            </p>
            <p className="mt-3 text-xs text-muted">This page updates automatically once payment is confirmed.</p>
          </div>
        </div>
      )}

      {/* STEP: SUCCESS */}
      {step === 'success' && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="text-6xl">✅</div>
          <div>
            <p className="font-bold text-lg text-charcoal">Payment Confirmed!</p>
            <p className="mt-1 text-sm text-muted">Your order has been placed for Week {week.weekNum}.</p>
            {location?.address && <p className="mt-2 text-xs text-muted">📌 Delivering to: {location.address}</p>}
            {mpesaCode && mpesaCode !== 'DEV_MODE' && (
              <p className="mt-2 text-xs font-mono bg-cream rounded px-2 py-1 text-mid">M-Pesa ref: {mpesaCode}</p>
            )}
          </div>
          <Button variant="terracotta" size="lg" className="w-full" onClick={handleSuccess}>
            View My Orders
          </Button>
        </div>
      )}

      {/* STEP: FAILED */}
      {step === 'failed' && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="text-6xl">❌</div>
          <div>
            <p className="font-bold text-lg text-charcoal">Payment Failed</p>
            <p className="mt-1 text-sm text-muted">The payment was not completed. Please try again.</p>
          </div>
          <Button variant="terracotta" size="lg" className="w-full" onClick={() => setStep('form')}>
            Try Again
          </Button>
        </div>
      )}
    </Modal>
  )
}
