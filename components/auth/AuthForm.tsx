'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { api } from '@/lib/api'

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

const registerSchema = z.object({
  name: z.string().min(2, 'Name too short'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
  phone: z.string().min(9, 'Enter a valid phone number'),
})

type LoginData = z.infer<typeof loginSchema>
type RegisterData = z.infer<typeof registerSchema>

type RegStep = 'details' | 'otp'

interface Props { onSuccess?: () => void }

export default function AuthForm({ onSuccess }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [regStep, setRegStep] = useState<RegStep>('details')
  const [otpCode, setOtpCode] = useState('')
  const [pendingData, setPendingData] = useState<RegisterData | null>(null)
  const [devOtp, setDevOtp] = useState<string | null>(null)

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) as never })
  const registerForm = useForm<RegisterData>({ resolver: zodResolver(registerSchema) as never })

  /* ---- LOGIN ---- */
  async function handleLogin(data: LoginData) {
    setLoading(true)
    const res = await signIn('credentials', { ...data, redirect: false })
    setLoading(false)
    if (res?.error) { toast('Invalid email or password', 'error'); return }
    toast('Welcome back!')
    onSuccess?.()
  }

  /* ---- REGISTER: Step 1 — send OTP ---- */
  async function handleSendOtp(data: RegisterData) {
    setLoading(true)
    try {
      const res = await api.post<{ message: string; devCode?: string }>('/api/auth/send-otp', { phone: data.phone })
      setPendingData(data)
      setDevOtp(res.devCode ?? null)
      setRegStep('otp')
      toast('Verification code sent to ' + data.phone)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to send code', 'error')
    } finally {
      setLoading(false)
    }
  }

  /* ---- REGISTER: Step 2 — verify OTP & create account ---- */
  async function handleVerifyAndRegister() {
    if (!pendingData || otpCode.length < 6) { toast('Enter the 6-digit code', 'error'); return }
    setLoading(true)
    try {
      // Verify OTP
      await api.post('/api/auth/verify-phone', { phone: pendingData.phone, code: otpCode })
      // Create account
      await api.post('/api/auth/register', pendingData)
      // Sign in
      const res = await signIn('credentials', { email: pendingData.email, password: pendingData.password, redirect: false })
      if (res?.error) throw new Error('Auto sign-in failed')
      toast('Account created! Welcome 🎉')
      onSuccess?.()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Registration failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex rounded-lg bg-cream p-1 mb-4">
        {(['login', 'register'] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); setRegStep('details'); setDevOtp(null) }}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${mode === m ? 'bg-warm-white text-charcoal shadow-sm' : 'text-muted'}`}>
            {m === 'login' ? 'Sign In' : 'Register'}
          </button>
        ))}
      </div>

      {/* LOGIN */}
      {mode === 'login' && (
        <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-3">
          <Input label="Email" type="email" placeholder="you@example.com"
            {...loginForm.register('email')} error={loginForm.formState.errors.email?.message} />
          <Input label="Password" type="password" placeholder="••••••••"
            {...loginForm.register('password')} error={loginForm.formState.errors.password?.message} />
          <div className="text-right">
            <Link href="/forgot-password" className="text-xs text-mid hover:text-forest">Forgot password?</Link>
          </div>
          <Button variant="terracotta" size="lg" className="w-full" loading={loading} type="submit">Sign In</Button>
        </form>
      )}

      {/* REGISTER — Step 1: Details */}
      {mode === 'register' && regStep === 'details' && (
        <form onSubmit={registerForm.handleSubmit(handleSendOtp)} className="space-y-3">
          <Input label="Full Name" placeholder="Jane Doe"
            {...registerForm.register('name')} error={registerForm.formState.errors.name?.message} />
          <Input label="Email" type="email" placeholder="you@example.com"
            {...registerForm.register('email')} error={registerForm.formState.errors.email?.message} />
          <Input label="Password" type="password" placeholder="Min 8 characters"
            {...registerForm.register('password')} error={registerForm.formState.errors.password?.message} />
          <Input label="Phone Number" type="tel" placeholder="0712 345 678"
            {...registerForm.register('phone')} error={registerForm.formState.errors.phone?.message} />
          <p className="text-xs text-muted">We&apos;ll send a verification code to this number.</p>
          <Button variant="terracotta" size="lg" className="w-full mt-2" loading={loading} type="submit">
            Send Verification Code
          </Button>
        </form>
      )}

      {/* REGISTER — Step 2: OTP */}
      {mode === 'register' && regStep === 'otp' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-forest/10 p-3 text-sm text-forest">
            📱 Code sent to <strong>{pendingData?.phone}</strong>. Enter it below.
          </div>
          {devOtp && (
            <div className="rounded-xl bg-gold/20 p-3 text-sm text-charcoal">
              🛠 Dev mode — your code is: <strong className="font-mono text-lg">{devOtp}</strong>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-mid mb-1">Verification Code</label>
            <input
              type="text" inputMode="numeric" maxLength={6} placeholder="000000"
              value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-lg border border-[rgba(45,74,62,0.2)] bg-warm-white px-4 py-3 text-center text-2xl font-mono tracking-widest text-charcoal focus:outline-none focus:ring-2 focus:ring-forest/40"
            />
          </div>
          <Button variant="terracotta" size="lg" className="w-full" loading={loading} onClick={handleVerifyAndRegister}>
            Verify &amp; Create Account
          </Button>
          <button onClick={() => setRegStep('details')} className="w-full text-center text-xs text-mid hover:text-forest">
            ← Change details / resend code
          </button>
        </div>
      )}
    </div>
  )
}
