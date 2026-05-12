import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { env } from '@/lib/env'
import { getProvider } from './providers'
import type { Store } from './types'

export interface SyncResult {
  appId: string
  store: Store
  throttled: boolean
  reviewsInserted: number
  reviewsSkipped: number
  error: string | null
}

interface SyncOptions {
  appId: string
  store: Store
  /** When true, ignore throttle window. */
  force?: boolean
  /** Override throttle window (minutes). Defaults to env var. */
  throttleMinutes?: number
}

interface AppRow {
  id: string
  play_package_name: string | null
  app_store_id: string | null
}

interface SyncStateRow {
  last_synced_at: string | null
  last_review_external_id: string | null
}

export async function syncStores(opts: SyncOptions): Promise<SyncResult> {
  const supabase = createAdminClient()
  const throttleMinutes = opts.throttleMinutes ?? env.STORES_SYNC_THROTTLE_MINUTES

  const { data: app, error: appErr } = await supabase
    .from('cc_apps')
    .select('id, play_package_name, app_store_id')
    .eq('id', opts.appId)
    .single<AppRow>()

  if (appErr || !app) {
    return errorResult(opts, `App not found: ${opts.appId}`)
  }

  const { data: state } = await supabase
    .from('cc_app_sync_state')
    .select('last_synced_at, last_review_external_id')
    .eq('app_id', opts.appId)
    .eq('store', opts.store)
    .maybeSingle<SyncStateRow>()

  if (!opts.force && isFresh(state?.last_synced_at, throttleMinutes)) {
    return {
      appId: opts.appId,
      store: opts.store,
      throttled: true,
      reviewsInserted: 0,
      reviewsSkipped: 0,
      error: null,
    }
  }

  const provider = getProvider(opts.store, {
    playPackageName: app.play_package_name,
    appStoreId: app.app_store_id,
  })

  const since = state?.last_synced_at ? new Date(state.last_synced_at) : undefined

  let result: Awaited<ReturnType<typeof provider.fetch>>
  try {
    result = await provider.fetch({ since })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown sync error'
    await supabase.from('app_sync_state').upsert({
      app_id: opts.appId,
      store: opts.store,
      last_synced_at: new Date().toISOString(),
      last_review_external_id: state?.last_review_external_id ?? null,
      last_error: message,
    })
    return errorResult(opts, message)
  }

  let inserted = 0
  let skipped = 0
  if (result.reviews.length > 0) {
    const rows = result.reviews.map((r) => ({
      app_id: opts.appId,
      store: opts.store,
      external_id: r.externalId,
      rating: r.rating,
      title: r.title,
      body: r.body,
      author: r.author,
      lang: r.lang,
      version: r.version,
      created_at_store: r.createdAtStore.toISOString(),
    }))

    const { data: insertedRows, error: insertErr } = await supabase
      .from('cc_reviews')
      .upsert(rows, { onConflict: 'app_id,store,external_id', ignoreDuplicates: true })
      .select('id')

    if (insertErr) return errorResult(opts, insertErr.message)
    inserted = insertedRows?.length ?? 0
    skipped = rows.length - inserted
  }

  if (result.metrics.length > 0) {
    const metricRows = result.metrics.map((m) => ({
      app_id: opts.appId,
      store: opts.store,
      date: m.date.toISOString().slice(0, 10),
      country_code: m.countryCode,
      device_type: m.deviceType,
      installs: m.installs,
      uninstalls: m.uninstalls,
      average_rating: m.averageRating,
      ratings_count: m.ratingsCount,
      reviews_count: m.reviewsCount,
      downloads: m.downloads,
      version: m.version,
    }))
    await supabase
      .from('cc_app_metrics_daily')
      .upsert(metricRows, { onConflict: 'app_id,store,date,country_code,device_type' })
  }

  await supabase.from('app_sync_state').upsert({
    app_id: opts.appId,
    store: opts.store,
    last_synced_at: new Date().toISOString(),
    last_review_external_id: result.cursor,
    last_error: null,
  })

  return {
    appId: opts.appId,
    store: opts.store,
    throttled: false,
    reviewsInserted: inserted,
    reviewsSkipped: skipped,
    error: null,
  }
}

export function isFresh(lastSyncedAt: string | null | undefined, throttleMinutes: number): boolean {
  if (!lastSyncedAt) return false
  const last = new Date(lastSyncedAt).getTime()
  if (Number.isNaN(last)) return false
  const elapsedMs = Date.now() - last
  return elapsedMs < throttleMinutes * 60_000
}

function errorResult(opts: SyncOptions, message: string): SyncResult {
  return {
    appId: opts.appId,
    store: opts.store,
    throttled: false,
    reviewsInserted: 0,
    reviewsSkipped: 0,
    error: message,
  }
}

export async function syncIfStale(appId: string): Promise<SyncResult[]> {
  const stores: Store[] = ['play', 'app_store']
  return Promise.all(stores.map((store) => syncStores({ appId, store })))
}
