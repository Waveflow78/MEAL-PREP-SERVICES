'use client'
import Link from 'next/link'

interface ClientSummary {
  id: string
  name: string
  email: string
  phone: string | null
  eatenLogs: { updatedAt: Date | string; items: { qty: number }[] }[]
}

interface Props {
  clients: ClientSummary[]
  coachName: string
}

export default function CoachClient({ clients, coachName }: Props) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-charcoal">My Clients</h1>
        <p className="mt-1 text-muted">Welcome back, {coachName} · {clients.length} client{clients.length !== 1 ? 's' : ''}</p>
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white py-24 text-center">
          <div className="text-6xl mb-4">🏋️</div>
          <h2 className="font-serif text-xl font-semibold text-charcoal">No clients yet</h2>
          <p className="mt-2 text-sm text-muted max-w-xs">
            Ask the admin to assign clients to your account. They will appear here once connected.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => {
            const lastLog = client.eatenLogs[0]
            const lastActive = lastLog
              ? new Date(lastLog.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
              : null
            const totalItems = lastLog
              ? lastLog.items.reduce((s, i) => s + i.qty, 0)
              : 0

            return (
              <Link
                key={client.id}
                href={`/coach/clients/${client.id}`}
                className="group flex flex-col gap-3 rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-5 shadow-sm transition-all hover:border-forest/40 hover:shadow-md"
              >
                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest/10 font-serif text-lg font-bold text-forest">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-charcoal truncate group-hover:text-forest transition-colors">
                      {client.name}
                    </p>
                    <p className="text-xs text-muted truncate">{client.email}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-3 text-xs">
                  <div className="flex-1 rounded-lg bg-cream p-2 text-center">
                    <p className="font-semibold text-charcoal">{lastActive ?? '—'}</p>
                    <p className="text-muted">Last log</p>
                  </div>
                  <div className="flex-1 rounded-lg bg-cream p-2 text-center">
                    <p className="font-semibold text-charcoal">{totalItems}</p>
                    <p className="text-muted">Items logged</p>
                  </div>
                </div>

                {client.phone && (
                  <p className="text-xs text-muted">📞 {client.phone}</p>
                )}

                <span className="mt-auto text-xs font-medium text-forest group-hover:underline">
                  View logs &amp; dashboard →
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
