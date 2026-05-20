export default function MenuLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <div className="h-52 animate-pulse bg-forest/80" />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1">
            <div className="mb-5 flex gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-cream" />
              ))}
            </div>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-cream" />
              ))}
            </div>
          </div>
          <div className="w-full lg:w-80">
            <div className="h-96 animate-pulse rounded-2xl bg-cream" />
          </div>
        </div>
      </div>
    </>
  )
}
