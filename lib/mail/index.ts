import 'server-only'
import { env } from '@/lib/env'
import { getTransporter } from './transporter'

export interface SendMailInput {
  to: string
  subject: string
  html: string
  text: string
}

type SendMailResult = { ok: true } | { ok: false; error: string }

/**
 * Sends a single email through the configured SMTP transport.
 * Returns a result object instead of throwing so callers can branch cleanly.
 */
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  try {
    const transporter = getTransporter()
    await transporter.sendMail({
      from: env.MAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    })
    return { ok: true }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Falha ao enviar email'
    console.error('[mail] sendMail failed:', error)
    return { ok: false, error }
  }
}

export { inviteEmail, recoveryEmail, type EmailContent } from './templates'
