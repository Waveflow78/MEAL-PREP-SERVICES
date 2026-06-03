import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

function randomPassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

/** GET /api/admin/employees — list all employees with today's time entry */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return forbidden()

  const employees = await prisma.user.findMany({
    where: { role: 'EMPLOYEE' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      timeEntries: {
        orderBy: { checkIn: 'desc' },
        take: 30,
      },
    },
    orderBy: { name: 'asc' },
  })

  return Response.json(employees)
}

/** POST /api/admin/employees — create a new employee */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return forbidden()

  const { name, phone } = await req.json()
  if (!name?.trim()) return Response.json({ error: 'Name is required' }, { status: 400 })

  // Generate email: firstname.lastname@staff.kimskitchen.com
  const slug = name.trim().toLowerCase().replace(/\s+/g, '.')
  let email = `${slug}@staff.kimskitchen.com`

  // If email already taken, append a number
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    const count = await prisma.user.count({ where: { email: { startsWith: `${slug}@staff` } } })
    email = `${slug}${count + 1}@staff.kimskitchen.com`
  }

  const plainPassword = randomPassword()
  const hashed = await bcrypt.hash(plainPassword, 10)

  const employee = await prisma.user.create({
    data: {
      name: name.trim(),
      email,
      password: hashed,
      phone: phone?.trim() || null,
      role: 'EMPLOYEE',
    },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
  })

  // Return plain password once — it is never stored in plain text
  return Response.json({ employee, plainPassword }, { status: 201 })
}
