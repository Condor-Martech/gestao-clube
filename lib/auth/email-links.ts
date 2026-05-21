import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

type AuthLinkType = 'invite' | 'recovery'

interface GenerateAuthLinkInput {
  /** Service-role client — generateLink is an admin-only operation. */
  admin: SupabaseClient
  type: AuthLinkType
  email: string
  /** User metadata, applied only on invite (e.g. the app role). */
  data?: Record<string, unknown>
}

type GenerateAuthLinkResult =
  | { ok: true; url: string; userId: string }
  | { ok: false; error: string }

/**
 * Generates a Supabase auth action token WITHOUT sending an email — GoTrue's
 * own SMTP is bypassed entirely. Returns an app-owned URL pointing at
 * /auth/confirm, which the caller delivers via our branded nodemailer email.
 *
 * The /auth/confirm route calls verifyOtp() with the token_hash, so we never
 * rely on GoTrue's redirect allow-list either.
 */
export async function generateAuthLink(
  input: GenerateAuthLinkInput,
): Promise<GenerateAuthLinkResult> {
  const { admin, type, email, data } = input

  // Discriminated union — keep the two calls separate so options stay typed.
  const { data: linkData, error } =
    type === 'invite'
      ? await admin.auth.admin.generateLink({
          type: 'invite',
          email,
          options: data ? { data } : undefined,
        })
      : await admin.auth.admin.generateLink({ type: 'recovery', email })

  if (error || !linkData?.properties || !linkData.user) {
    return { ok: false, error: error?.message ?? 'Falha ao gerar o link de autenticação' }
  }

  // Invite users land on the welcome variant; recovery users on the plain one.
  const next = type === 'invite' ? '/reset-password?welcome=1' : '/reset-password'

  const url = new URL('/auth/confirm', env.NEXT_PUBLIC_APP_URL)
  url.searchParams.set('token_hash', linkData.properties.hashed_token)
  url.searchParams.set('type', type)
  url.searchParams.set('next', next)

  return { ok: true, url: url.toString(), userId: linkData.user.id }
}
