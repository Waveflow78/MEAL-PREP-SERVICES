import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendSms, formatKenyanPhone } from '@/lib/sms'

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()
    if (!phone) return Response.json({ error: 'Phone required' }, { status: 400 })

    const normalised = formatKenyanPhone(phone)
    if (normalised.length < 12) return Response.json({ error: 'Invalid phone number' }, { status: 400 })

    const code = generateOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min

    // Invalidate old OTPs for this phone
    await prisma.phoneOtp.updateMany({
      where: { phone: normalised, used: false },
      data: { used: true },
    })

    await prisma.phoneOtp.create({ data: { phone: normalised, code, expiresAt } })

    const { success, error } = await sendSms(
      normalised,
      `Your Mali Meals verification code is: ${code}. Expires in 10 minutes.`
    )

    if (!success) return Response.json({ error: error || 'SMS failed' }, { status: 500 })

    // In dev without AT credentials, return code so testers can proceed
    const devCode = (!process.env.AT_API_KEY && process.env.NODE_ENV !== 'production') ? code : undefined
    return Response.json({ message: 'OTP sent', ...(devCode ? { devCode } : {}) })
  } catch {
    return Response.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}
