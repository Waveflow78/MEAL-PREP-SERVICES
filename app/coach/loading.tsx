export default function CoachLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="h-8 w-48 rounded-lg bg-cream animate-pulse mb-2" />
      <div className="h-4 w-64 rounded-lg bg-cream animate-pulse mb-8" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-cream animate-pulse" />
        ))}
      </div>
    </div>
  )
}
