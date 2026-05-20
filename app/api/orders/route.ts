import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: { include: { meal: true } }, week: true },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json(orders)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { items } = await req.json() as { items: { mealId: string; qty: number }[] }

    const totalMeals = items.reduce((s, i) => s + i.qty, 0)
    if (totalMeals < 10) return Response.json({ error: 'Minimum 10 meals required' }, { status: 400 })

    const mealIds = items.map((i) => i.mealId)
    const meals = await prisma.meal.findMany({ where: { id: { in: mealIds } } })
    if (meals.length !== mealIds.length) return Response.json({ error: 'Invalid meal(s)' }, { status: 400 })

    const mealMap = Object.fromEntries(meals.map((m) => [m.id, m]))
    const activeWeek = await prisma.week.findFirst({ where: { active: true } })
    if (!activeWeek) return Response.json({ error: 'No active week' }, { status: 400 })

    let subtotal = 0, totalCal = 0, totalPro = 0, totalCarb = 0, totalFat = 0, totalFib = 0, totalSod = 0
    const orderItems = items.map((i) => {
      const m = mealMap[i.mealId]
      const linePrice = m.price * i.qty
      subtotal += linePrice
      totalCal += m.cal * i.qty
      totalPro += m.pro * i.qty
      totalCarb += m.carb * i.qty
      totalFat += m.fat * i.qty
      totalFib += m.fib * i.qty
      totalSod += m.sod * i.qty
      return { mealId: i.mealId, qty: i.qty, unitPrice: m.price, linePrice }
    })

    const delivery = 200
    const total = subtotal + delivery

    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        weekId: activeWeek.id,
        items: { create: orderItems },
        subtotal, delivery, total,
        totalCal, totalPro, totalCarb, totalFat, totalFib, totalSod,
      },
      include: { items: { include: { meal: true } }, week: true },
    })

    return Response.json(order, { status: 201 })
  } catch {
    return Response.json({ error: 'Failed to place order' }, { status: 500 })
  }
}
