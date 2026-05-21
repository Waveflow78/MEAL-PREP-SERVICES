import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()
    if (!name || !email || !password) return Response.json({ error: 'All fields required' }, { status: 400 })

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return Response.json({ error: 'Email already registered' }, { status: 409 })

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
    })

    return Response.json({ id: user.id, name: user.name, email: user.email })
  } catch {
    return Response.json({ error: 'Registration failed' }, { status: 500 })
  }
}
