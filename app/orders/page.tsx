import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import OrderCard from '@/components/orders/OrderCard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'My Orders' }

export default async function OrdersPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: { include: { meal: true } }, week: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-charcoal">My Orders</h1>
        <p className="mt-1 text-muted">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[rgba(45,74,62,0.12)] bg-warm-white py-20 text-center">
          <div className="text-6xl mb-4">🥗</div>
          <h2 className="font-serif text-xl font-semibold text-charcoal">No orders yet</h2>
          <p className="mt-2 text-muted">Browse this week&apos;s menu and place your first order.</p>
          <Link href="/menu" className="mt-6 rounded-lg bg-terracotta px-5 py-2.5 text-sm font-medium text-white hover:bg-terracotta-light">
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {orders.map((order) => <OrderCard key={order.id} order={order as never} />)}
        </div>
      )}
    </div>
  )
}
