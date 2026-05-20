import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Daraja sends a POST to this URL after the customer enters their PIN
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const stkCallback = body?.Body?.stkCallback

    if (!stkCallback) return Response.json({ ResultCode: 0, ResultDesc: 'Accepted' })

    const { CheckoutRequestID, ResultCode, CallbackMetadata } = stkCallback

    const order = await prisma.order.findFirst({ where: { mpesaCheckoutId: CheckoutRequestID } })
    if (!order) return Response.json({ ResultCode: 0, ResultDesc: 'Accepted' })

    if (ResultCode === 0) {
      // Payment successful — extract M-Pesa receipt code
      const items: { Name: string; Value: string | number }[] = CallbackMetadata?.Item ?? []
      const receiptItem = items.find((i) => i.Name === 'MpesaReceiptNumber')
      const mpesaCode = receiptItem ? String(receiptItem.Value) : undefined

      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'PAID', mpesaCode, status: 'CONFIRMED' },
      })
    } else {
      await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: 'FAILED' } })
    }

    return Response.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch (e) {
    console.error('[M-Pesa callback]', e)
    return Response.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }
}
