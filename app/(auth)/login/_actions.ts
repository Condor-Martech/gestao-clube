'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginSchema } from '@/lib/validators/auth'

type ActionResult = { ok: true } | { ok: false; error: string }

export async function signInAction(input: unknown): Promise<ActionResult> {
  const parsed = LoginSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return {
      ok: false,
      error:
        error.message === 'Invalid login credentials' ? 'Email ou senha incorretos' : error.message,
    }
  }

  redirect('/dashboard')
}
