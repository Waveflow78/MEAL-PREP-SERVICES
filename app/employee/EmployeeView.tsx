'use client'
import { useState } from 'react'
import type { TimeEntry } from '@/types'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/Toast'

interface Props {
  name: string
  entries: TimeEntry[]
  openEntry: TimeEntry | null
}

function fmt(dt: string | null | undefined) {
  if (!dt) return '—'
  return new Date(dt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function duration(checkIn: string, checkOut: string | null) {
  const end = checkOut ? new Date(checkOut) : new Date()
  const ms = end.getTime() - new Date(checkIn).getTime()
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}h ${m}m`
}

export default function EmployeeView({ name, entries: initial, openEntry: initialOpen }: Props) {
  const [entries, setEntries] = useState<TimeEntry[]>(initial)
  const [openEntry, setOpenEntry] = useState<TimeEntry | null>(initialOpen)
  const [loading, setLoading] = useState(false)

  const isCheckedIn = !!openEntry

  async function handleCheckIn() {
    setLoading(true)
    try {
      const entry = await api.post<TimeEntry>('/api/employee/time', {})
      setOpenEntry(entry)
      setEntries((prev) => [entry, ...prev])
      toast('Checked in successfully ✅')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Check-in failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckOut() {
    setLoading(true)
    try {
      const updated = await api.patch<TimeEntry>('/api/employee/time', {})
      setOpenEntry(null)
      setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
      toast('Checked out successfully 👋')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Check-out failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const totalHours = entries
    .filter((e) => e.checkOut)
    .reduce((sum, e) => {
      const ms = new Date(e.checkOut!).getTime() - new Date(e.checkIn).getTime()
      return sum + ms / 3600000
    }, 0)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-charcoal">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {name.split(' ')[0]} 👋</h1>
        <p className="mt-1 text-muted">{today}</p>
      </div>

      {/* Check in / out card */}
      <div className={`rounded-2xl border-2 p-6 text-center transition-colors ${isCheckedIn ? 'border-forest bg-forest/5' : 'border-[rgba(45,74,62,0.15)] bg-warm-white'}`}>
        <div className="text-5xl mb-3">{isCheckedIn ? '🟢' : '🔴'}</div>
        <p className="font-semibold text-charcoal text-lg mb-1">
          {isCheckedIn ? 'You are clocked in' : 'You are clocked out'}
        </p>
        {isCheckedIn && openEntry && (
          <p className="text-sm text-muted mb-4">
            Since {fmt(openEntry.checkIn)} · {duration(openEntry.checkIn, null)} elapsed
          </p>
        )}
        {!isCheckedIn && (
          <p className="text-sm text-muted mb-4">Tap the button below to start your shift</p>
        )}
        <button
          onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
          disabled={loading}
          className={`px-8 py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-60 ${
            isCheckedIn
              ? 'bg-terracotta hover:bg-terracotta/90'
              : 'bg-forest hover:bg-forest/90'
          }`}
        >
          {loading ? '...' : isCheckedIn ? 'Check Out' : 'Check In'}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-4 text-center">
          <p className="text-2xl font-bold text-charcoal">{entries.filter((e) => e.checkOut).length}</p>
          <p className="text-xs text-muted">Shifts completed</p>
        </div>
        <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-4 text-center">
          <p className="text-2xl font-bold text-charcoal">{totalHours.toFixed(1)}h</p>
          <p className="text-xs text-muted">Total hours</p>
        </div>
        <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white p-4 text-center">
          <p className="text-2xl font-bold text-charcoal">
            {entries.filter((e) => {
              const d = new Date(e.checkIn)
              const now = new Date()
              return d.getFullYear() === now.getFullYear() &&
                     d.getMonth() === now.getMonth() &&
                     d.getDate() === now.getDate()
            }).length > 0 ? '✅' : '—'}
          </p>
          <p className="text-xs text-muted">Today</p>
        </div>
      </div>

      {/* Time history */}
      <div>
        <h2 className="mb-3 font-serif text-xl font-semibold text-charcoal">My Time History</h2>
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white py-12 text-center">
            <div className="text-4xl mb-2">🕐</div>
            <p className="text-sm text-muted">No time entries yet</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white divide-y divide-[rgba(45,74,62,0.08)] overflow-hidden">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal">{fmtDate(e.checkIn)}</p>
                  {e.note && <p className="text-xs text-muted mt-0.5">{e.note}</p>}
                </div>
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted">{fmt(e.checkIn)}</span>
                    <span className="text-muted">→</span>
                    <span className={e.checkOut ? 'text-charcoal' : 'text-forest font-medium'}>
                      {e.checkOut ? fmt(e.checkOut) : 'Active'}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    {e.checkOut ? duration(e.checkIn, e.checkOut) : `${duration(e.checkIn, null)} so far`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
