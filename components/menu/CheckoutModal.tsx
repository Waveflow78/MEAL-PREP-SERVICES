'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Meal, Week } from '@/types'
import { useCartStore } from '@/store/cartStore'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'

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
  const total = totals.price + 200

  const [step, setStep] = useState<Step>('form')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [mpesaCode, setMpesaCode] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Reset state when modal opens
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

    // Timeout after 3 min
    const timeout = setTimeout(() => {
      clearInterval(pollRef.current!)
      if (step === 'waiting') setStep('failed')
    }, 180_000)

    return () => { clearInterval(pollRef.current!); clearTimeout(timeout) }
  }, [step, orderId, clearCart])

  async function handlePay() {
    if (!address.trim()) { toast('Please enter your delivery address', 'error'); return }
    if (!phone.trim()) { toast('Please enter your M-Pesa phone number', 'error'); return }
    setLoading(true)
    try {
      const res = await api.post<{ orderId: string; devMode?: boolean }>('/api/mpesa/initiate', {
        items: Object.entries(items).filter(([, q]) => q > 0).map(([mealId, qty]) => ({ mealId, qty })),
        deliveryAddress: address,
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
      <div className="mb-4 rounded-xl bg-cream p-3 space-y-1 text-sm">
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
          <Input
            label="Delivery Address"
            placeholder="e.g. 14 Nairobi Lane, Westlands, Nairobi"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <Input
            label="M-Pesa Phone Number"
            placeholder="e.g. 0712345678"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <p className="text-xs text-muted">
            You will receive a push notification on your phone to confirm payment of <strong>KSh {total.toLocaleString()}</strong>.
          </p>
          <Button variant="terracotta" size="lg" className="w-full" loading={loading} onClick={handlePay}>
            🔒 Pay KSh {total.toLocaleString()} via M-Pesa
          </Button>
        </div>
      )}

      {/* STEP: WAITING */}
      {step === 'waiting' && (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="w-14 h-14 rounded-full border-4 border-forest border-t-transparent animate-spin" />
          <div>
            <p className="font-semibold text-charcoal">Check your phone!</p>
            <p className="mt-1 text-sm text-muted">Enter your M-Pesa PIN to confirm payment of <strong>KSh {total.toLocaleString()}</strong>.</p>
            <p className="mt-3 text-xs text-muted">This page will update automatically once payment is confirmed.</p>
          </div>
        </div>
      )}

      {/* STEP: SUCCESS */}
      {step === 'success' && (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="text-6xl">✅</div>
          <div>
            <p className="font-bold text-lg text-charcoal">Payment Confirmed!</p>
            <p className="mt-1 text-sm text-muted">Your order has been placed for Week {week.weekNum}.</p>
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
        <div className="flex flex-col items-center gap-4 py-6 text-center">
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
