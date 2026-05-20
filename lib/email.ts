/**
 * Email helper using Nodemailer (SMTP) or Resend
 * SMTP: Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 * Resend: Set RESEND_API_KEY, EMAIL_FROM
 */
import nodemailer from 'nodemailer'

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  // Resend path
  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Kim's Kitchen <noreply@kimskitchen.com>",
      to,
      subject,
      html,
    })
    return
  }

  // SMTP / Gmail path
  if (process.env.SMTP_HOST) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "Kim's Kitchen <noreply@kimskitchen.com>",
      to,
      subject,
      html,
    })
    return
  }

  // Dev fallback — log to console
  console.log(`\n[EMAIL DEV] To: ${to}\nSubject: ${subject}\n${html}\n`)
}
