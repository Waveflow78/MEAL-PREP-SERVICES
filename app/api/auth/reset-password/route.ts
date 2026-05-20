import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()
    if (!token || !password) return Response.json({ error: 'Token and password required' }, { status: 400 })
    if (password.length < 8) return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!record || record.used || record.expiresAt < new Date()) {
      return Response.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 10)
    await prisma.user.update({ where: { id: record.userId }, data: { password: hashed } })
    await prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } })

    return Response.json({ message: 'Password reset successfully' })
  } catch {
    return Response.json({ error: 'Reset failed' }, { status: 500 })
  }
}
