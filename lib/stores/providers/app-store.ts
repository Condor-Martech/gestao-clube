import 'server-only'
import jwt from 'jsonwebtoken'
import { env } from '@/lib/env'
import {
  StoreProviderError,
  type FetchOptions,
  type FetchResult,
  type MetricsRecord,
  type ReviewRecord,
  type StoreProvider,
} from '../types'

interface AppStoreReviewAttributes {
  rating: number
  title: string | null
  body: string | null
  reviewerNickname: string | null
  createdDate: string
  territory: string | null
}

interface AppStoreReviewResource {
  id: string
  attributes: AppStoreReviewAttributes
}

interface AppStoreReviewsResponse {
  data: AppStoreReviewResource[]
  links?: { next?: string }
}

const AUDIENCE = 'appstoreconnect-v1'
const TOKEN_TTL_SECONDS = 19 * 60

let cachedToken: { value: string; expiresAt: number } | null = null

function signAppleJWT(): string {
  const { APP_STORE_CONNECT_KEY_ID, APP_STORE_CONNECT_ISSUER_ID, APP_STORE_CONNECT_PRIVATE_KEY } =
    env
  if (!APP_STORE_CONNECT_KEY_ID || !APP_STORE_CONNECT_ISSUER_ID || !APP_STORE_CONNECT_PRIVATE_KEY) {
    throw new StoreProviderError(
      'MISSING_CREDENTIALS',
      'App Store Connect credentials are not configured (KEY_ID, ISSUER_ID, PRIVATE_KEY).',
    )
  }

  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && cachedToken.expiresAt - 60 > now) return cachedToken.value

  const expiresAt = now + TOKEN_TTL_SECONDS
  const token = jwt.sign(
    { iss: APP_STORE_CONNECT_ISSUER_ID, iat: now, exp: expiresAt, aud: AUDIENCE },
    APP_STORE_CONNECT_PRIVATE_KEY.replace(/\\n/g, '\n'),
    { algorithm: 'ES256', header: { alg: 'ES256', kid: APP_STORE_CONNECT_KEY_ID, typ: 'JWT' } },
  )
  cachedToken = { value: token, expiresAt }
  return token
}

export function parseAppStoreReviews(json: AppStoreReviewsResponse): ReviewRecord[] {
  return json.data.map((item) => ({
    externalId: item.id,
    rating: item.attributes.rating,
    title: item.attributes.title,
    body: item.attributes.body,
    author: item.attributes.reviewerNickname,
    lang: null,
    version: null,
    createdAtStore: new Date(item.attributes.createdDate),
  }))
}

export class AppStoreProvider implements StoreProvider {
  readonly store = 'app_store' as const
  constructor(public readonly id: string) {}

  async fetch(opts: FetchOptions = {}): Promise<FetchResult> {
    const limit = Math.min(opts.limit ?? 200, 200)
    const url = new URL(`https://api.appstoreconnect.apple.com/v1/apps/${this.id}/customerReviews`)
    url.searchParams.set('limit', String(limit))
    url.searchParams.set('sort', '-createdDate')

    let response: Response
    try {
      response = await fetch(url, { headers: { Authorization: `Bearer ${signAppleJWT()}` } })
    } catch (cause) {
      throw new StoreProviderError('UNKNOWN', 'Network error calling App Store Connect', cause)
    }

    if (response.status === 401 || response.status === 403) {
      throw new StoreProviderError(
        'AUTH_FAILED',
        `App Store Connect auth failed (${response.status})`,
      )
    }
    if (response.status === 429) {
      throw new StoreProviderError('RATE_LIMITED', 'App Store Connect rate limited')
    }
    if (!response.ok) {
      throw new StoreProviderError('UNKNOWN', `App Store Connect error ${response.status}`)
    }

    let json: AppStoreReviewsResponse
    try {
      json = (await response.json()) as AppStoreReviewsResponse
    } catch (cause) {
      throw new StoreProviderError('PARSE_FAILED', 'Invalid JSON from App Store Connect', cause)
    }

    const reviews = parseAppStoreReviews(json).filter((r) =>
      opts.since ? r.createdAtStore > opts.since : true,
    )

    const metrics: MetricsRecord[] = []
    return { reviews, metrics, cursor: reviews[0]?.externalId ?? null }
  }
}

/** Reset JWT cache — used by tests. */
export function __resetAppStoreTokenCache() {
  cachedToken = null
}
