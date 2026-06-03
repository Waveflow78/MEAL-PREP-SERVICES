export default function EmployeeLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="h-8 w-56 rounded-lg bg-cream animate-pulse" />
      <div className="h-4 w-40 rounded-lg bg-cream animate-pulse" />
      <div className="h-44 rounded-2xl bg-cream animate-pulse" />
      <div className="grid grid-cols-3 gap-3">
        {[0,1,2].map((i) => <div key={i} className="h-20 rounded-2xl bg-cream animate-pulse" />)}
      </div>
      <div className="h-64 rounded-2xl bg-cream animate-pulse" />
    </div>
  )
}
