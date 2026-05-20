import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const [totalOrders, totalUsers, totalMeals, activeWeek] = await Promise.all([
    prisma.order.count(),
    prisma.user.count(),
    prisma.meal.count({ where: { active: true } }),
    prisma.week.findFirst({ where: { active: true } }),
  ])

  const weekOrders = activeWeek
    ? await prisma.order.count({ where: { weekId: activeWeek.id } })
    : 0

  const revenueAgg = await prisma.order.aggregate({ _sum: { total: true } })
  const weekRevenueAgg = activeWeek
    ? await prisma.order.aggregate({ where: { weekId: activeWeek.id }, _sum: { total: true } })
    : { _sum: { total: 0 } }

  const statusGroups = await prisma.order.groupBy({ by: ['status'], _count: true })
  const statusCounts = Object.fromEntries(statusGroups.map((g) => [g.status, g._count]))

  return Response.json({
    totalOrders,
    weekOrders,
    totalUsers,
    totalMeals,
    totalRevenue: revenueAgg._sum.total ?? 0,
    weekRevenue: weekRevenueAgg._sum.total ?? 0,
    statusCounts,
    activeWeek,
  })
}
