'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AuthForm from '@/components/auth/AuthForm'

export default function LoginPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (pending && session?.user) {
      if (session.user.role === 'EMPLOYEE') router.push('/employee')
      else if (session.user.role === 'ADMIN') router.push('/admin')
      else if (session.user.role === 'COACH') router.push('/coach')
      else router.push('/menu')
    }
  }, [pending, session, router])

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-bold text-charcoal">Welcome back</h1>
          <p className="mt-2 text-muted">Sign in to your Mali Meals account</p>
        </div>
        <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-8 shadow-sm">
          <AuthForm onSuccess={() => setPending(true)} />
        </div>
      </div>
    </div>
  )
}
