import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ClientView from './ClientView'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ clientId: string }> }): Promise<Metadata> {
  const { clientId } = await params
  const user = await prisma.user.findUnique({ where: { id: clientId }, select: { name: true } })
  return { title: user ? `${user.name} — Client View` : 'Client' }
}

export default async function ClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'COACH') redirect('/menu')

  // Verify this client belongs to this coach
  const client = await prisma.user.findUnique({
    where: { id: clientId, coachId: session.user.id },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
  })
  if (!client) notFound()

  // Active week
  const week = await prisma.week.findFirst({
    where: { active: true },
    include: { meals: { where: { active: true }, orderBy: { createdAt: 'asc' } } },
  })

  // Client's food logs for the active week
  const logs = week
    ? await prisma.eatenLog.findMany({
        where: { userId: clientId, weekNum: week.weekNum },
        include: { items: { include: { meal: true } } },
        orderBy: { day: 'asc' },
      })
    : []

  return (
    <ClientView
      client={client as never}
      meals={week?.meals as never ?? []}
      logs={logs as never}
      weekNum={week?.weekNum ?? null}
    />
  )
}
