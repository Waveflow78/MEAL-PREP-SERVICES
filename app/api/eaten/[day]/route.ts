import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { DayOfWeek } from '@/types'

const VALID_DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export async function PUT(req: NextRequest, ctx: RouteContext<'/api/eaten/[day]'>) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { day } = await ctx.params
  if (!VALID_DAYS.includes(day as DayOfWeek)) {
    return Response.json({ error: 'Invalid day' }, { status: 400 })
  }

  const { mealId, qty } = await req.json() as { mealId: string; qty: number }

  const activeWeek = await prisma.week.findFirst({ where: { active: true } })
  if (!activeWeek) return Response.json({ error: 'No active week' }, { status: 400 })

  const eatenLog = await prisma.eatenLog.upsert({
    where: { userId_weekNum_day: { userId: session.user.id, weekNum: activeWeek.weekNum, day: day as DayOfWeek } },
    create: { userId: session.user.id, weekNum: activeWeek.weekNum, day: day as DayOfWeek },
    update: {},
  })

  if (qty <= 0) {
    await prisma.eatenItem.deleteMany({ where: { eatenLogId: eatenLog.id, mealId } })
  } else {
    const existing = await prisma.eatenItem.findFirst({ where: { eatenLogId: eatenLog.id, mealId } })
    if (existing) {
      await prisma.eatenItem.update({ where: { id: existing.id }, data: { qty } })
    } else {
      await prisma.eatenItem.create({ data: { eatenLogId: eatenLog.id, mealId, qty } })
    }
  }

  const updated = await prisma.eatenLog.findUnique({
    where: { id: eatenLog.id },
    include: { items: { include: { meal: true } } },
  })

  return Response.json(updated)
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/eaten/[day]'>) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { day } = await ctx.params
  const activeWeek = await prisma.week.findFirst({ where: { active: true } })
  if (!activeWeek) return Response.json({ error: 'No active week' }, { status: 400 })

  const log = await prisma.eatenLog.findUnique({
    where: { userId_weekNum_day: { userId: session.user.id, weekNum: activeWeek.weekNum, day: day as DayOfWeek } },
  })
  if (log) await prisma.eatenItem.deleteMany({ where: { eatenLogId: log.id } })

  return Response.json({ ok: true })
}
