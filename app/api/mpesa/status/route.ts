import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const orderId = req.nextUrl.searchParams.get('orderId')
  if (!orderId) return Response.json({ error: 'orderId required' }, { status: 400 })

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id },
    select: { paymentStatus: true, mpesaCode: true, status: true },
  })

  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 })

  return Response.json({ paymentStatus: order.paymentStatus, mpesaCode: order.mpesaCode })
}
