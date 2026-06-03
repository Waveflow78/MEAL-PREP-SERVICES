'use client'
import { useRouter } from 'next/navigation'
import AuthForm from '@/components/auth/AuthForm'

export default function RegisterPage() {
  const router = useRouter()
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-bold text-charcoal">Get started</h1>
          <p className="mt-2 text-muted">Create your Mali Meals account</p>
        </div>
        <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-8 shadow-sm">
          <AuthForm onSuccess={() => router.push('/menu')} />
        </div>
      </div>
    </div>
  )
}
