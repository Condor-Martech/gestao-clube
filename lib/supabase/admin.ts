import 'server-only'
import { createClient as createAdminBaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

/**
 * Service-role client. Bypasses RLS — only use server-side and only for
 * operations that genuinely need admin access (creating users, bypassing
 * row-level policies for system maintenance).
 *
 * Will throw if SUPABASE_SERVICE_ROLE_KEY isn't configured.
 */
export function createAdminClient() {
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }

  return createAdminBaseClient(env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
