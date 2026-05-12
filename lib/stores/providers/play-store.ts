import 'server-only'
import { type FetchOptions, type FetchResult, type StoreProvider } from '../types'
import { getPlayAuth, __resetPlayAuthCache } from './play-store-auth'
import { fetchPlayReviews } from './play-store-reviews'

export { __resetPlayAuthCache as __resetPlayStoreAuthCache }

export class PlayStoreProvider implements StoreProvider {
  readonly store = 'play' as const
  constructor(public readonly id: string) {}

  async fetch(opts: FetchOptions = {}): Promise<FetchResult> {
    const auth = getPlayAuth()
    const { reviews, cursor } = await fetchPlayReviews({
      packageName: this.id,
      auth,
      since: opts.since,
      limit: opts.limit,
    })
    return { reviews, metrics: [], cursor }
  }
}
