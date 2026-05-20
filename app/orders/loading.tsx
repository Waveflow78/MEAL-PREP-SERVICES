export default function OrdersLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <div className="h-9 w-40 animate-pulse rounded-lg bg-cream" />
        <div className="mt-2 h-4 w-24 animate-pulse rounded bg-cream" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-56 animate-pulse rounded-2xl bg-cream" />
        ))}
      </div>
    </div>
  )
}
