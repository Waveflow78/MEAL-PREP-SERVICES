export default function EatenLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 h-9 w-32 animate-pulse rounded-lg bg-cream" />
      <div className="mb-6 flex gap-2">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-8 w-14 animate-pulse rounded-full bg-cream" />
        ))}
      </div>
      <div className="flex gap-6">
        <div className="flex-1 grid gap-3 sm:grid-cols-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-cream" />
          ))}
        </div>
        <div className="hidden lg:block w-80 space-y-4">
          <div className="h-48 animate-pulse rounded-2xl bg-cream" />
          <div className="h-48 animate-pulse rounded-2xl bg-cream" />
        </div>
      </div>
    </div>
  )
}
