export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <div className="h-9 w-36 animate-pulse rounded-lg bg-cream" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-cream" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-cream" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-96 animate-pulse rounded-2xl bg-cream" />
        <div className="h-96 animate-pulse rounded-2xl bg-cream" />
      </div>
    </div>
  )
}
