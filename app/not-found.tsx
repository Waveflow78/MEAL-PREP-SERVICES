import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="text-7xl mb-4">🥗</div>
      <h1 className="font-serif text-4xl font-bold text-charcoal">404</h1>
      <p className="mt-3 text-muted">This page couldn&apos;t be found.</p>
      <Link href="/menu" className="mt-6 rounded-lg bg-forest px-5 py-2.5 text-sm font-medium text-white hover:bg-forest-light">
        Back to Menu
      </Link>
    </div>
  )
}
