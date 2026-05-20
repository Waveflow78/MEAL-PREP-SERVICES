import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatKenyanPhone } from '@/lib/sms'

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json()
    if (!phone || !code) return Response.json({ error: 'Phone and code required' }, { status: 400 })

    const normalised = formatKenyanPhone(phone)
    const otp = await prisma.phoneOtp.findFirst({
      where: { phone: normalised, code, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })

    if (!otp) return Response.json({ error: 'Invalid or expired code' }, { status: 400 })

    await prisma.phoneOtp.update({ where: { id: otp.id }, data: { used: true } })
    return Response.json({ verified: true })
  } catch {
    return Response.json({ error: 'Verification failed' }, { status: 500 })
  }
}
