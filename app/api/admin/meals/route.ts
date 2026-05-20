import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const meals = await prisma.meal.findMany({ orderBy: { createdAt: 'desc' }, include: { week: true } })
  return Response.json(meals)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { weekNum, ...mealData } = body

    const week = await prisma.week.findUnique({ where: { weekNum: Number(weekNum) } })
    if (!week) return Response.json({ error: 'Week not found' }, { status: 400 })

    const meal = await prisma.meal.create({
      data: { ...mealData, weekId: week.id, badge: mealData.badge || null },
    })
    return Response.json(meal, { status: 201 })
  } catch {
    return Response.json({ error: 'Failed to create meal' }, { status: 500 })
  }
}
