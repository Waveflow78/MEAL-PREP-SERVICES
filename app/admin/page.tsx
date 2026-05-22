import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AdminClient from './AdminClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Admin Panel' }

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/menu')

  const [orders, meals, activeWeek, allUsers] = await Promise.all([
    prisma.order.findMany({
      include: { items: { include: { meal: true } }, user: { select: { name: true, email: true } }, week: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.meal.findMany({ where: { active: true }, orderBy: { createdAt: 'desc' } }),
    prisma.week.findFirst({ where: { active: true } }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, coachId: true, coach: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    }),
  ])

  const [totalOrders, totalUsers, revenueAgg] = await Promise.all([
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.aggregate({ _sum: { total: true } }),
  ])

  const weekOrders = activeWeek
    ? await prisma.order.count({ where: { weekId: activeWeek.id } })
    : 0

  const stats = {
    totalOrders,
    weekOrders,
    totalUsers,
    totalMeals: meals.length,
    totalRevenue: revenueAgg._sum.total ?? 0,
    weekRevenue: 0,
    statusCounts: {} as Record<string, number>,
    activeWeek,
  }

  return <AdminClient orders={orders as never} meals={meals as never} stats={stats as never} activeWeek={activeWeek as never} allUsers={allUsers as never} />
}
