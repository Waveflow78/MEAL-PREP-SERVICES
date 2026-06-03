/**
 * Safaricom M-Pesa Daraja API helper
 * Env vars: MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET,
 *           MPESA_PASSKEY, MPESA_SHORTCODE, MPESA_ENV (sandbox|live)
 */

const SANDBOX = 'https://sandbox.safaricom.co.ke'
const LIVE    = 'https://api.safaricom.co.ke'

function baseUrl() {
  return process.env.MPESA_ENV === 'live' ? LIVE : SANDBOX
}

export async function getMpesaToken(): Promise<string> {
  const key    = process.env.MPESA_CONSUMER_KEY!
  const secret = process.env.MPESA_CONSUMER_SECRET!
  const creds  = Buffer.from(`${key}:${secret}`).toString('base64')

  const res = await fetch(`${baseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${creds}` },
  })
  const data = await res.json() as { access_token: string }
  return data.access_token
}

export async function stkPush(params: {
  phone: string        // 254XXXXXXXXX
  amount: number       // integer KES
  orderId: string
  callbackUrl: string
}) {
  const shortcode = process.env.MPESA_SHORTCODE!
  const passkey   = process.env.MPESA_PASSKEY!
  const token     = await getMpesaToken()

  const now = new Date()
  const timestamp = now
    .toISOString()
    .replace(/[-T:\.Z]/g, '')
    .slice(0, 14)

  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')

  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.ceil(params.amount),
    PartyA: params.phone,
    PartyB: shortcode,
    PhoneNumber: params.phone,
    CallBackURL: params.callbackUrl,
    AccountReference: params.orderId,
    TransactionDesc: `Mali Meals order ${params.orderId}`,
  }

  const res = await fetch(`${baseUrl()}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  return res.json() as Promise<{
    MerchantRequestID: string
    CheckoutRequestID: string
    ResponseCode: string
    ResponseDescription: string
    CustomerMessage: string
  }>
}
