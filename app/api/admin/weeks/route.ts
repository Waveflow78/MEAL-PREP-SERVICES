import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const weeks = await prisma.week.findMany({ orderBy: { weekNum: 'desc' } })
  return Response.json(weeks)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { weekNum, startDate } = await req.json()

  await prisma.week.updateMany({ where: { active: true }, data: { active: false } })

  const week = await prisma.week.upsert({
    where: { weekNum: Number(weekNum) },
    create: { weekNum: Number(weekNum), startDate: new Date(startDate), active: true },
    update: { startDate: new Date(startDate), active: true },
  })

  return Response.json(week, { status: 201 })
}
