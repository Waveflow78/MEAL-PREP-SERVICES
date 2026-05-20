import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { DayOfWeek, DaySummary } from '@/types'

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const activeWeek = await prisma.week.findFirst({ where: { active: true } })
  if (!activeWeek) return Response.json([])

  const logs = await prisma.eatenLog.findMany({
    where: { userId: session.user.id, weekNum: activeWeek.weekNum },
    include: { items: { include: { meal: true } } },
  })

  const logMap = Object.fromEntries(logs.map((l) => [l.day, l]))

  const summary: DaySummary[] = DAYS.map((day) => {
    const log = logMap[day]
    if (!log) return { day, cal: 0, pro: 0, carb: 0, fat: 0, fib: 0, sod: 0, mealCount: 0 }
    let cal = 0, pro = 0, carb = 0, fat = 0, fib = 0, sod = 0, mealCount = 0
    for (const item of log.items) {
      cal += item.meal.cal * item.qty
      pro += item.meal.pro * item.qty
      carb += item.meal.carb * item.qty
      fat += item.meal.fat * item.qty
      fib += item.meal.fib * item.qty
      sod += item.meal.sod * item.qty
      mealCount += item.qty
    }
    return { day, cal, pro, carb, fat, fib, sod, mealCount }
  })

  return Response.json(summary)
}
