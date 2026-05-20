import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(session: { user?: { role?: string } } | null) {
  return session?.user?.role === 'ADMIN'
}

export async function PUT(req: NextRequest, ctx: RouteContext<'/api/admin/meals/[id]'>) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await ctx.params
  try {
    const body = await req.json()
    const { weekNum, ...mealData } = body

    let weekId: string | undefined
    if (weekNum) {
      const week = await prisma.week.findUnique({ where: { weekNum: Number(weekNum) } })
      if (!week) return Response.json({ error: 'Week not found' }, { status: 400 })
      weekId = week.id
    }

    const meal = await prisma.meal.update({
      where: { id },
      data: { ...mealData, badge: mealData.badge || null, ...(weekId ? { weekId } : {}) },
    })
    return Response.json(meal)
  } catch {
    return Response.json({ error: 'Failed to update meal' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/admin/meals/[id]'>) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await ctx.params
  try {
    await prisma.meal.update({ where: { id }, data: { active: false } })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to delete meal' }, { status: 500 })
  }
}
