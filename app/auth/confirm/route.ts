import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_TYPES: readonly EmailOtpType[] = ['invite', 'recovery']

/**
 * Lands the user from an invite / password-reset email. Verifies the OTP
 * token_hash — which establishes the session cookie — then forwards to `next`.
 *
 * Uses next/navigation's redirect() (not NextResponse.redirect) so the cookies
 * written by verifyOtp propagate onto the redirect response.
 *
 * This route MUST stay a public path in lib/supabase/middleware.ts — the user
 * has no session yet when they click the email link.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  // Only allow internal, single-slash redirects — guards against open redirect.
  const rawNext = searchParams.get('next') ?? '/dashboard'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard'

  if (tokenHash && type && ALLOWED_TYPES.includes(type)) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

    if (!error) {
      redirect(next)
    }
    console.error('[auth/confirm] verifyOtp failed:', error.message)
  }

  redirect('/login?error=link_invalido')
}
