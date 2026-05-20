import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stkPush } from '@/lib/mpesa'
import { formatKenyanPhone } from '@/lib/sms'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { items, deliveryAddress, mpesaPhone } = await req.json() as {
      items: { mealId: string; qty: number }[]
      deliveryAddress: string
      mpesaPhone: string
    }

    if (!deliveryAddress?.trim()) return Response.json({ error: 'Delivery address required' }, { status: 400 })
    if (!mpesaPhone?.trim()) return Response.json({ error: 'M-Pesa phone required' }, { status: 400 })

    const totalMeals = items.reduce((s, i) => s + i.qty, 0)
    if (totalMeals < 3) return Response.json({ error: 'Minimum 3 meals required' }, { status: 400 })

    const mealIds = items.map((i) => i.mealId)
    const meals = await prisma.meal.findMany({ where: { id: { in: mealIds } } })
    if (meals.length !== mealIds.length) return Response.json({ error: 'Invalid meal(s)' }, { status: 400 })

    const activeWeek = await prisma.week.findFirst({ where: { active: true } })
    if (!activeWeek) return Response.json({ error: 'No active week' }, { status: 400 })

    const mealMap = Object.fromEntries(meals.map((m) => [m.id, m]))
    let subtotal = 0, totalCal = 0, totalPro = 0, totalCarb = 0, totalFat = 0, totalFib = 0, totalSod = 0

    const orderItems = items.map((i) => {
      const m = mealMap[i.mealId]
      const linePrice = m.price * i.qty
      subtotal += linePrice
      totalCal += m.cal * i.qty; totalPro += m.pro * i.qty; totalCarb += m.carb * i.qty
      totalFat += m.fat * i.qty; totalFib += m.fib * i.qty; totalSod += m.sod * i.qty
      return { mealId: i.mealId, qty: i.qty, unitPrice: m.price, linePrice }
    })

    const delivery = 200
    const total = subtotal + delivery
    const normPhone = formatKenyanPhone(mpesaPhone)

    // Create PENDING order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        weekId: activeWeek.id,
        items: { create: orderItems },
        subtotal, delivery, total,
        totalCal, totalPro, totalCarb, totalFat, totalFib, totalSod,
        deliveryAddress,
        mpesaPhone: normPhone,
        paymentStatus: 'PENDING',
      },
    })

    // Check if M-Pesa is configured
    if (!process.env.MPESA_CONSUMER_KEY) {
      // Dev mode: auto-mark as paid so flow can be tested
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'PAID', mpesaCode: 'DEV_MODE' },
      })
      return Response.json({ orderId: order.id, devMode: true, message: 'Dev mode: payment auto-approved' })
    }

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const stk = await stkPush({
      phone: normPhone,
      amount: total,
      orderId: order.id,
      callbackUrl: `${appUrl}/api/mpesa/callback`,
    })

    if (stk.ResponseCode !== '0') {
      await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: 'FAILED' } })
      return Response.json({ error: stk.ResponseDescription || 'M-Pesa initiation failed' }, { status: 400 })
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { mpesaCheckoutId: stk.CheckoutRequestID },
    })

    return Response.json({
      orderId: order.id,
      checkoutRequestId: stk.CheckoutRequestID,
      message: stk.CustomerMessage,
    })
  } catch (e) {
    console.error('[M-Pesa initiate]', e)
    return Response.json({ error: 'Payment initiation failed' }, { status: 500 })
  }
}
