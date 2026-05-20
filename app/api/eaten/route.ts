import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const activeWeek = await prisma.week.findFirst({ where: { active: true } })
  if (!activeWeek) return Response.json([])

  const logs = await prisma.eatenLog.findMany({
    where: { userId: session.user.id, weekNum: activeWeek.weekNum },
    include: { items: { include: { meal: true } } },
  })

  return Response.json(logs)
}
