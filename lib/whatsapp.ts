/**
 * WhatsApp helper using Twilio WhatsApp API (no SDK — pure fetch)
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID   – e.g. ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   TWILIO_AUTH_TOKEN    – from twilio.com/console
 *   TWILIO_WHATSAPP_FROM – sandbox: +14155238886  |  production: your approved WA number
 *
 * Sandbox setup:
 *   1. Go to https://www.twilio.com/console/sms/whatsapp/sandbox
 *   2. Each recipient must WhatsApp "join <word>" to +14155238886 once to opt in
 *
 * Production:
 *   Apply for a WhatsApp Business number in Twilio console.
 *   Message templates must be pre-approved by Meta for outbound notifications.
 */

import { formatKenyanPhone } from './sms'

function isConfigured() {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM
  )
}

/** Normalise to E.164 WhatsApp address: "whatsapp:+254XXXXXXXXX" */
function toWhatsAppAddress(raw: string): string {
  const normalised = formatKenyanPhone(raw.trim())
  const e164 = normalised.startsWith('+') ? normalised : `+${normalised}`
  return `whatsapp:${e164}`
}

export interface WhatsAppResult {
  phone: string
  success: boolean
  error?: string
}

/** Send a single WhatsApp message via Twilio */
export async function sendWhatsApp(phone: string, message: string): Promise<WhatsAppResult> {
  if (!isConfigured()) {
    console.warn('[WhatsApp] Twilio credentials not set — message skipped:', message.slice(0, 60))
    return { phone, success: true } // dev fallback: don't error, just skip
  }

  const sid   = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!
  const from  = process.env.TWILIO_WHATSAPP_FROM!

  const body = new URLSearchParams({
    From: `whatsapp:${from.replace('whatsapp:', '')}`,
    To:   toWhatsAppAddress(phone),
    Body: message,
  })

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[WhatsApp] Twilio error:', err)
      return { phone, success: false, error: (err as { message?: string }).message ?? `HTTP ${res.status}` }
    }

    return { phone, success: true }
  } catch (err) {
    console.error('[WhatsApp] Network error:', err)
    return { phone, success: false, error: err instanceof Error ? err.message : 'Network error' }
  }
}

/** Broadcast a message to a list of phone numbers */
export async function broadcastWhatsApp(
  phones: string[],
  message: string
): Promise<{ sent: number; failed: number; results: WhatsAppResult[] }> {
  const results = await Promise.all(phones.map((p) => sendWhatsApp(p, message)))
  const sent   = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length
  return { sent, failed, results }
}

export { isConfigured as whatsAppConfigured }
