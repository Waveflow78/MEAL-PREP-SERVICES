'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

function ResetForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')
    try {
      await api.post('/api/auth/reset-password', { token, password })
      router.push('/login?reset=1')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  if (!token) return (
    <div className="text-center text-sm text-terracotta">Invalid reset link. Please request a new one.</div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="New Password" type="password" placeholder="Min 8 characters"
        value={password} onChange={(e) => setPassword(e.target.value)} required />
      <Input label="Confirm Password" type="password" placeholder="Repeat password"
        value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      {error && <p className="text-xs text-terracotta">{error}</p>}
      <Button variant="terracotta" size="lg" className="w-full" loading={loading} type="submit">
        Set New Password
      </Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm rounded-2xl bg-warm-white p-8 shadow-sm border border-[rgba(45,74,62,0.12)]">
        <div className="mb-6 text-center">
          <div className="text-4xl mb-2">🔑</div>
          <h1 className="font-serif text-2xl font-bold text-charcoal">Set New Password</h1>
          <p className="mt-1 text-sm text-muted">Choose a strong password for your account.</p>
        </div>
        <Suspense fallback={<div className="text-center text-sm text-muted">Loading...</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
