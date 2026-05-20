'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="text-7xl mb-4">⚠️</div>
      <h2 className="font-serif text-2xl font-bold text-charcoal">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted">{error.message}</p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className="rounded-lg bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-light">
          Try again
        </button>
        <Link href="/menu" className="rounded-lg border border-[rgba(45,74,62,0.25)] px-4 py-2 text-sm font-medium text-mid hover:border-forest hover:text-forest">
          Go to Menu
        </Link>
      </div>
    </div>
  )
}
