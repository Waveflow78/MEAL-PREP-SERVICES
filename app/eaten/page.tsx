import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import EatenClient from './EatenClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Food Log' }

export default async function EatenPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const week = await prisma.week.findFirst({
    where: { active: true },
    include: { meals: { where: { active: true }, orderBy: { createdAt: 'asc' } } },
  })

  const logs = week
    ? await prisma.eatenLog.findMany({
        where: { userId: session.user.id, weekNum: week.weekNum },
        include: { items: true },
      })
    : []

  return <EatenClient meals={week?.meals as never ?? []} initialLogs={logs as never} />
}
