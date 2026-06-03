import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { broadcastWhatsApp } from '@/lib/whatsapp'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const weeks = await prisma.week.findMany({ orderBy: { weekNum: 'desc' } })
  return Response.json(weeks)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { weekNum, startDate, notifyWhatsApp = true } = await req.json()

  // Deactivate current active week
  await prisma.week.updateMany({ where: { active: true }, data: { active: false } })

  // Create or update the new active week
  const week = await prisma.week.upsert({
    where: { weekNum: Number(weekNum) },
    create: { weekNum: Number(weekNum), startDate: new Date(startDate), active: true },
    update: { startDate: new Date(startDate), active: true },
  })

  // Auto-broadcast WhatsApp to all customers with phone numbers (if enabled)
  if (notifyWhatsApp) {
    const users = await prisma.user.findMany({
      where: { role: 'CUSTOMER', phone: { not: null } },
      select: { phone: true },
    })
    const phones = users.map((u) => u.phone!)

    if (phones.length > 0) {
      const dateLabel = new Date(startDate).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long'
      })
      const message =
        `🍱 *Mali Meals — Week ${weekNum} Menu is Live!*\n\n` +
        `Our new menu for the week of ${dateLabel} is now available.\n\n` +
        `Visit our website to view the meals and place your order 👇\n` +
        `https://meal-prep-services.vercel.app/menu`

      // Fire-and-forget — don't block the response
      broadcastWhatsApp(phones, message).then(({ sent, failed }) => {
        console.log(`[WhatsApp] Week ${weekNum} broadcast: ${sent} sent, ${failed} failed`)
      }).catch((e) => {
        console.error('[WhatsApp] Broadcast error:', e)
      })
    }
  }

  return Response.json(week, { status: 201 })
}
