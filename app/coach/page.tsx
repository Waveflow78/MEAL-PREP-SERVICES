import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CoachClient from './CoachClient'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'My Clients' }

export default async function CoachPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'COACH') redirect('/menu')

  const clients = await prisma.user.findMany({
    where: { coachId: session.user.id },
    orderBy: { name: 'asc' },
    include: {
      eatenLogs: {
        orderBy: { updatedAt: 'desc' },
        take: 1,
        include: { items: true },
      },
    },
  })

  return <CoachClient clients={clients as never} coachName={session.user.name ?? 'Coach'} />
}
