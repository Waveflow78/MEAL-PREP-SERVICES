import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

/** GET /api/admin/coaches — list all users (for assignment UI) */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return forbidden()

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      coachId: true,
      coach: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  })

  return Response.json(users)
}

/**
 * POST /api/admin/coaches
 * Body options:
 *   { action: 'promote',  userId: string }          → set role to COACH
 *   { action: 'demote',   userId: string }          → set role back to CUSTOMER, remove all coachId refs
 *   { action: 'assign',   clientId, coachId }       → link client to coach
 *   { action: 'unassign', clientId: string }        → remove coach from client
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return forbidden()

  const body = await req.json()
  const { action } = body

  if (action === 'promote') {
    const { userId } = body
    if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })
    await prisma.user.update({ where: { id: userId }, data: { role: 'COACH' } })
    return Response.json({ ok: true })
  }

  if (action === 'demote') {
    const { userId } = body
    if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })
    // Remove this coach from all their clients first
    await prisma.user.updateMany({ where: { coachId: userId }, data: { coachId: null } })
    await prisma.user.update({ where: { id: userId }, data: { role: 'CUSTOMER' } })
    return Response.json({ ok: true })
  }

  if (action === 'assign') {
    const { clientId, coachId } = body
    if (!clientId || !coachId) return Response.json({ error: 'clientId and coachId required' }, { status: 400 })
    await prisma.user.update({ where: { id: clientId }, data: { coachId } })
    return Response.json({ ok: true })
  }

  if (action === 'unassign') {
    const { clientId } = body
    if (!clientId) return Response.json({ error: 'clientId required' }, { status: 400 })
    await prisma.user.update({ where: { id: clientId }, data: { coachId: null } })
    return Response.json({ ok: true })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}
