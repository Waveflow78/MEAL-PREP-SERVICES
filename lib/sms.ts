/**
 * SMS helper using Africa's Talking
 * Set AT_API_KEY and AT_USERNAME in your .env.local
 * Sandbox: AT_USERNAME=sandbox, AT_API_KEY=any-string
 */

export function formatKenyanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('0') && digits.length === 10) return '254' + digits.slice(1)
  if (digits.startsWith('254') && digits.length === 12) return digits
  if (digits.startsWith('7') && digits.length === 9) return '254' + digits
  return digits
}

export async function sendSms(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.AT_API_KEY
  const username = process.env.AT_USERNAME

  if (!apiKey || !username) {
    console.warn('[SMS] AT_API_KEY / AT_USERNAME not set — SMS not sent. Message:', message)
    return { success: true } // graceful dev fallback
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AfricasTalking = require('africastalking')
    const at = AfricasTalking({ apiKey, username })
    const formatted = '+' + formatKenyanPhone(phone)
    await at.SMS.send({ to: [formatted], message, from: process.env.AT_SENDER_ID || undefined })
    return { success: true }
  } catch (err) {
    console.error('[SMS] Send error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'SMS failed' }
  }
}
