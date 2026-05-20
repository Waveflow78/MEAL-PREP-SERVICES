import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const weekNumParam = searchParams.get('weekNum')
    const category = searchParams.get('category')

    const where = weekNumParam
      ? { weekNum: parseInt(weekNumParam) }
      : { active: true }

    const week = await prisma.week.findFirst({
      where,
      include: {
        meals: {
          where: {
            active: true,
            ...(category ? { cat: category as never } : {}),
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!week) return Response.json({ error: 'No active week found' }, { status: 404 })

    return Response.json({ meals: week.meals, week })
  } catch {
    return Response.json({ error: 'Failed to load menu' }, { status: 500 })
  }
}
