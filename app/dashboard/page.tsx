import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const week = await prisma.week.findFirst({ where: { active: true } })
  const meals = week
    ? await prisma.meal.findMany({ where: { weekId: week.id, active: true } })
    : []

  const logs = week
    ? await prisma.eatenLog.findMany({
        where: { userId: session.user.id, weekNum: week.weekNum },
        include: { items: { include: { meal: true } } },
      })
    : []

  return <DashboardClient meals={meals as never} initialLogs={logs as never} />
}
