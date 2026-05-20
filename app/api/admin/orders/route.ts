import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const weekNum = searchParams.get('weekNum')

  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(weekNum ? { week: { weekNum: parseInt(weekNum) } } : {}),
    },
    include: { items: { include: { meal: true } }, user: { select: { name: true, email: true } }, week: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return Response.json(orders)
}
