import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

/** GET /api/employee/time — return all time entries for the current employee */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'EMPLOYEE') return forbidden()

  const entries = await prisma.timeEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { checkIn: 'desc' },
    take: 50,
  })

  return Response.json(entries)
}

/** POST /api/employee/time — check in (creates a new open TimeEntry) */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'EMPLOYEE') return forbidden()

  // Prevent double check-in (open entry already exists)
  const open = await prisma.timeEntry.findFirst({
    where: { userId: session.user.id, checkOut: null },
  })
  if (open) return Response.json({ error: 'Already checked in' }, { status: 409 })

  const body = await req.json().catch(() => ({}))
  const entry = await prisma.timeEntry.create({
    data: {
      userId: session.user.id,
      checkIn: new Date(),
      note: body.note?.trim() || null,
    },
  })

  return Response.json(entry, { status: 201 })
}

/** PATCH /api/employee/time — check out (closes the open TimeEntry) */
export async function PATCH() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'EMPLOYEE') return forbidden()

  const open = await prisma.timeEntry.findFirst({
    where: { userId: session.user.id, checkOut: null },
    orderBy: { checkIn: 'desc' },
  })
  if (!open) return Response.json({ error: 'No active check-in found' }, { status: 404 })

  const updated = await prisma.timeEntry.update({
    where: { id: open.id },
    data: { checkOut: new Date() },
  })

  return Response.json(updated)
}
