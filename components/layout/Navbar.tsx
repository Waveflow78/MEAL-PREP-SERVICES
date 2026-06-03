'use client'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const customerLinks = [
  { href: '/menu',      label: 'Menu' },
  { href: '/orders',    label: 'My Orders' },
  { href: '/eaten',     label: 'Food Log' },
  { href: '/dashboard', label: 'Dashboard' },
]

const adminLinks = [
  { href: '/menu',   label: 'Menu' },
  { href: '/orders', label: 'My Orders' },
]

const employeeLinks: { href: string; label: string }[] = []

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const role = session?.user?.role
  const baseLinks =
    role === 'ADMIN'    ? adminLinks :
    role === 'EMPLOYEE' ? employeeLinks :
    customerLinks   // CUSTOMER + COACH both see customer links

  return (
    <nav className="sticky top-0 z-40 border-b border-[rgba(45,74,62,0.12)] bg-warm-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href={role === 'EMPLOYEE' ? '/employee' : '/menu'} className="font-serif text-xl font-bold text-forest">
          Kim&apos;s Kitchen
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 md:flex">
          {baseLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors ${pathname === l.href ? 'text-forest' : 'text-mid hover:text-forest'}`}
            >
              {l.label}
            </Link>
          ))}
          {role === 'EMPLOYEE' && (
            <Link href="/employee" className={`text-sm font-medium ${pathname === '/employee' ? 'text-forest' : 'text-mid hover:text-forest'}`}>
              My Hours
            </Link>
          )}
          {role === 'COACH' && (
            <Link href="/coach" className={`text-sm font-medium ${pathname?.startsWith('/coach') ? 'text-forest' : 'text-mid hover:text-forest'}`}>
              My Clients
            </Link>
          )}
          {role === 'ADMIN' && (
            <Link href="/admin" className={`text-sm font-medium ${pathname === '/admin' ? 'text-terracotta' : 'text-mid hover:text-terracotta'}`}>
              Admin
            </Link>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {session ? (
            <>
              <span className="text-sm text-mid">{session.user.name}</span>
              <button onClick={() => signOut({ callbackUrl: '/login' })} className="rounded-lg border border-[rgba(45,74,62,0.25)] px-3 py-1.5 text-sm text-mid hover:border-forest hover:text-forest">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-mid hover:text-forest">Sign in</Link>
              <Link href="/register" className="rounded-lg bg-forest px-3 py-1.5 text-sm text-white hover:bg-forest-light">Get started</Link>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button className="md:hidden text-mid" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-[rgba(45,74,62,0.12)] bg-warm-white px-4 pb-4 md:hidden">
          {baseLinks.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-medium text-mid hover:text-forest">
              {l.label}
            </Link>
          ))}
          {role === 'EMPLOYEE' && (
            <Link href="/employee" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-medium text-mid hover:text-forest">My Hours</Link>
          )}
          {role === 'COACH' && (
            <Link href="/coach" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-medium text-mid hover:text-forest">My Clients</Link>
          )}
          {role === 'ADMIN' && (
            <Link href="/admin" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-medium text-mid hover:text-terracotta">Admin</Link>
          )}
          <div className="mt-3 border-t border-[rgba(45,74,62,0.12)] pt-3">
            {session ? (
              <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-sm text-mid">Sign out</button>
            ) : (
              <Link href="/login" onClick={() => setMenuOpen(false)} className="text-sm text-mid">Sign in</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
