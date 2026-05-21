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
})

type LoginData = z.infer<typeof loginSchema>
type RegisterData = z.infer<typeof registerSchema>

interface Props { onSuccess?: () => void }

export default function AuthForm({ onSuccess }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) as never })
  const registerForm = useForm<RegisterData>({ resolver: zodResolver(registerSchema) as never })

  async function handleLogin(data: LoginData) {
    setLoading(true)
    const res = await signIn('credentials', { ...data, redirect: false })
    setLoading(false)
    if (res?.error) { toast('Invalid email or password', 'error'); return }
    toast('Welcome back!')
    onSuccess?.()
  }

  async function handleRegister(data: RegisterData) {
    setLoading(true)
    try {
      await api.post('/api/auth/register', data)
      const res = await signIn('credentials', { email: data.email, password: data.password, redirect: false })
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
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${mode === m ? 'bg-warm-white text-charcoal shadow-sm' : 'text-muted'}`}
          >
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
          <Button variant="terracotta" size="lg" className="w-full" loading={loading} type="submit">
            Sign In
          </Button>
        </form>
      )}

      {/* REGISTER */}
      {mode === 'register' && (
        <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-3">
          <Input label="Full Name" placeholder="Jane Doe"
            {...registerForm.register('name')} error={registerForm.formState.errors.name?.message} />
          <Input label="Email" type="email" placeholder="you@example.com"
            {...registerForm.register('email')} error={registerForm.formState.errors.email?.message} />
          <Input label="Password" type="password" placeholder="Min 8 characters"
            {...registerForm.register('password')} error={registerForm.formState.errors.password?.message} />
          <Button variant="terracotta" size="lg" className="w-full mt-2" loading={loading} type="submit">
            Create Account
          </Button>
        </form>
      )}
    </div>
  )
}
