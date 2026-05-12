import 'server-only'

export type Store = 'play' | 'app_store'

export interface ReviewRecord {
  externalId: string
  rating: number
  title: string | null
  body: string | null
  author: string | null
  lang: string | null
  version: string | null
  createdAtStore: Date
}

export type DeviceType = 'PHONE' | 'TABLET' | 'TV' | 'WEAR' | 'OTHER'

export interface MetricsRecord {
  date: Date
  averageRating: number | null
  ratingsCount: number | null
  reviewsCount: number | null
  downloads: number | null
  version: string | null
  countryCode: string | null
  deviceType: DeviceType | null
  installs: number | null
  uninstalls: number | null
}

export interface FetchOptions {
  /** Earliest review timestamp to consider; provider may ignore if not supported. */
  since?: Date
  /** Hard cap on rows returned in a single sync. */
  limit?: number
}

export interface FetchResult {
  reviews: ReviewRecord[]
  metrics: MetricsRecord[]
  /**
   * The provider's notion of "latest review id seen" — opaque cursor used by
   * sync-service to skip re-fetching old reviews on the next call.
   */
  cursor: string | null
}

export interface StoreProvider {
  readonly store: Store
  readonly id: string
  fetch(opts?: FetchOptions): Promise<FetchResult>
}

export class StoreProviderError extends Error {
  constructor(
    public readonly code:
      | 'MISSING_CREDENTIALS'
      | 'MISSING_PLAY_PERMISSIONS'
      | 'AUTH_FAILED'
      | 'RATE_LIMITED'
      | 'PARSE_FAILED'
      | 'UNKNOWN',
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'StoreProviderError'
  }
}
