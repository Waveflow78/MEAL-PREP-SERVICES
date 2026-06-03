/**
 * POST /api/admin/whatsapp
 * Body:
 *   {
 *     message: string,
 *     to: 'all_customers' | 'ordered_this_week' | 'all_employees' | string[]
 *   }
 *
 * Returns: { sent, failed, skipped (no phone), total }
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { broadcastWhatsApp } from '@/lib/whatsapp'

function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return forbidden()

  const { message, to } = await req.json()
  if (!message?.trim()) return Response.json({ error: 'message is required' }, { status: 400 })

  let phones: string[] = []

  if (Array.isArray(to)) {
    // Explicit phone list passed directly
    phones = to.filter(Boolean)
  } else if (to === 'all_customers') {
    const users = await prisma.user.findMany({
      where: { role: 'CUSTOMER', phone: { not: null } },
      select: { phone: true },
    })
    phones = users.map((u) => u.phone!)
  } else if (to === 'ordered_this_week') {
    const activeWeek = await prisma.week.findFirst({ where: { active: true } })
    if (!activeWeek) return Response.json({ error: 'No active week' }, { status: 400 })
    const orders = await prisma.order.findMany({
      where: { weekId: activeWeek.id, user: { phone: { not: null } } },
      select: { user: { select: { phone: true } } },
      distinct: ['userId'],
    })
    phones = orders.map((o) => o.user.phone!)
  } else if (to === 'all_employees') {
    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE', phone: { not: null } },
      select: { phone: true },
    })
    phones = employees.map((u) => u.phone!)
  } else {
    return Response.json({ error: 'Invalid "to" value' }, { status: 400 })
  }

  const skipped = 0 // already filtered for non-null phones above
  const { sent, failed, results } = await broadcastWhatsApp(phones, message.trim())

  return Response.json({
    sent,
    failed,
    skipped,
    total: phones.length,
    errors: results.filter((r) => !r.success).map((r) => ({ phone: r.phone, error: r.error })),
  })
}

/** GET /api/admin/whatsapp — check if WhatsApp is configured */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return forbidden()

  const configured = !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM
  )

  // Count how many users have phone numbers
  const [customerCount, employeeCount] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER', phone: { not: null } } }),
    prisma.user.count({ where: { role: 'EMPLOYEE', phone: { not: null } } }),
  ])

  return Response.json({ configured, customerCount, employeeCount })
}
