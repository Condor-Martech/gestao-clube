'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ResetPasswordSchema } from '@/lib/validators/auth'

type ActionResult = { ok: true } | { ok: false; error: string }

/**
 * Sets a new password for the currently authenticated user. The session is
 * the short-lived one established by /auth/confirm (verifyOtp), so this only
 * works right after following an invite or password-reset email link.
 */
export async function updatePasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = ResetPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const supabase = await createClient()

  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) {
    return { ok: false, error: 'Sessão expirada. Solicite um novo link.' }
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    return { ok: false, error: error.message }
  }

  redirect('/dashboard')
}
