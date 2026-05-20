'use client'
import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await api.post('/api/auth/forgot-password', { email })
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm rounded-2xl bg-warm-white p-8 shadow-sm border border-[rgba(45,74,62,0.12)]">
        <div className="mb-6 text-center">
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="font-serif text-2xl font-bold text-charcoal">Forgot Password</h1>
          <p className="mt-1 text-sm text-muted">Enter your email and we&apos;ll send a reset link.</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="rounded-xl bg-forest/10 p-4 text-sm text-forest font-medium">
              ✅ Reset link sent! Check your inbox (and spam folder).
            </div>
            <Link href="/login" className="block text-sm text-mid hover:text-forest">← Back to Sign In</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <p className="text-xs text-terracotta">{error}</p>}
            <Button variant="terracotta" size="lg" className="w-full" loading={loading} type="submit">
              Send Reset Link
            </Button>
            <Link href="/login" className="block text-center text-sm text-mid hover:text-forest">← Back to Sign In</Link>
          </form>
        )}
      </div>
    </div>
  )
}
