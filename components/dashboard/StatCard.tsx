interface Props {
  label: string
  value: string | number
  goal?: string
  highlight?: boolean
}

export default function StatCard({ label, value, goal, highlight }: Props) {
  return (
    <div className={`rounded-2xl p-5 ${highlight ? 'bg-forest text-white' : 'border border-[rgba(45,74,62,0.12)] bg-warm-white'}`}>
      <div className={`text-xs font-semibold uppercase tracking-wider ${highlight ? 'text-white/60' : 'text-muted'}`}>{label}</div>
      <div className={`mt-1 text-3xl font-bold ${highlight ? 'text-white' : 'text-charcoal'}`}>{value}</div>
      {goal && <div className={`mt-1 text-xs ${highlight ? 'text-white/60' : 'text-muted'}`}>{goal}</div>}
    </div>
  )
}
