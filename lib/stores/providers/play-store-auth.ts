import 'server-only'
import { GoogleAuth } from 'google-auth-library'
import { env } from '@/lib/env'
import { StoreProviderError } from '../types'

const SCOPES = [
  'https://www.googleapis.com/auth/androidpublisher',
  'https://www.googleapis.com/auth/playdeveloperreporting',
] as const

let cachedAuth: GoogleAuth | null = null

export function getPlayAuth(): GoogleAuth {
  if (cachedAuth) return cachedAuth
  const raw = env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
  if (!raw) {
    throw new StoreProviderError(
      'MISSING_CREDENTIALS',
      'GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not configured.',
    )
  }
  let credentials: unknown
  try {
    credentials = JSON.parse(raw)
  } catch (cause) {
    throw new StoreProviderError('AUTH_FAILED', 'Invalid service account JSON', cause)
  }
  cachedAuth = new GoogleAuth({
    credentials: credentials as Record<string, unknown>,
    scopes: [...SCOPES],
  })
  return cachedAuth
}

/** Reset auth cache — used by tests. */
export function __resetPlayAuthCache() {
  cachedAuth = null
}
