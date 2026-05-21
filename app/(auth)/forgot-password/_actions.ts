'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { generateAuthLink } from '@/lib/auth/email-links'
import { sendMail, recoveryEmail } from '@/lib/mail'
import { ForgotPasswordSchema } from '@/lib/validators/auth'
import { env } from '@/lib/env'

type ActionResult = { ok: true } | { ok: false; error: string }

/**
 * Requests a password-reset email. To avoid leaking which addresses are
 * registered, this always resolves to { ok: true } once the input is valid —
 * a missing account or a failed send is logged server-side, not surfaced.
 */
export async function requestPasswordResetAction(input: unknown): Promise<ActionResult> {
  const parsed = ForgotPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY não configurada' }
  }

  const { email } = parsed.data
  const admin = createAdminClient()

  const link = await generateAuthLink({ admin, type: 'recovery', email })

  if (!link.ok) {
    // Most common cause: the email isn't registered. Stay silent on purpose.
    console.warn('[forgot-password] generateLink failed:', link.error)
    return { ok: true }
  }

  const { subject, html, text } = recoveryEmail({ actionUrl: link.url })
  const sent = await sendMail({ to: email, subject, html, text })

  if (!sent.ok) {
    console.error('[forgot-password] sendMail failed:', sent.error)
  }

  return { ok: true }
}
