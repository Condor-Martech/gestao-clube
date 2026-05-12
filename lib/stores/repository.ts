import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { ReviewFilter } from '@/lib/validators/store'
import type { Store } from './types'
import {
  aggregateMetricsByCountry,
  aggregateMetricsByDevice,
  aggregateDailyMetrics,
  type CountryAggregate,
  type DailyAggregate,
  type DeviceAggregate,
  type MetricsRowLike,
} from './metrics-aggregations'

export interface AppRow {
  id: string
  name: string
  play_package_name: string | null
  app_store_id: string | null
}

export interface ReviewWithAnalysis {
  id: string
  app_id: string
  store: 'play' | 'app_store'
  external_id: string
  rating: number
  title: string | null
  body: string | null
  author: string | null
  lang: string | null
  version: string | null
  created_at_store: string
  fetched_at: string
  analysis: {
    sentiment: 'pos' | 'neu' | 'neg'
    topics: string[]
    summary: string | null
  } | null
}

export async function listApps(): Promise<AppRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cc_apps')
    .select('id, name, play_package_name, app_store_id')
    .order('name')
  if (error) throw error
  return (data ?? []) as AppRow[]
}

export async function getApp(id: string): Promise<AppRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cc_apps')
    .select('id, name, play_package_name, app_store_id')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as AppRow | null
}

export async function listReviews(filter: ReviewFilter) {
  const supabase = await createClient()
  let query = supabase
    .from('cc_reviews')
    .select(
      `id, app_id, store, external_id, rating, title, body, author, lang, version,
       created_at_store, fetched_at,
       cc_review_analyses(sentiment, topics, summary)`,
      { count: 'exact' },
    )
    .eq('app_id', filter.appId)

  if (filter.store) query = query.eq('store', filter.store)
  if (filter.ratings?.length) query = query.in('rating', filter.ratings)
  if (filter.version) query = query.eq('version', filter.version)
  if (filter.lang) query = query.eq('lang', filter.lang)
  if (filter.from) query = query.gte('created_at_store', filter.from)
  if (filter.to) query = query.lte('created_at_store', filter.to)
  if (filter.search) {
    query = query.or(`title.ilike.%${filter.search}%,body.ilike.%${filter.search}%`)
  }

  const offset = (filter.page - 1) * filter.pageSize
  query = query
    .order('created_at_store', { ascending: false })
    .range(offset, offset + filter.pageSize - 1)

  const { data, error, count } = await query
  if (error) throw error

  const rows: ReviewWithAnalysis[] = (data ?? []).map((row) => {
    const analyses = (row as { cc_review_analyses: unknown }).cc_review_analyses
    const analysis = Array.isArray(analyses) ? analyses[0] : analyses
    return {
      ...(row as Omit<ReviewWithAnalysis, 'analysis'>),
      analysis: analysis ?? null,
    }
  })

  let filtered = rows
  if (filter.sentiments?.length) {
    filtered = filtered.filter((r) => r.analysis && filter.sentiments!.includes(r.analysis.sentiment))
  }
  if (filter.topics?.length) {
    filtered = filtered.filter(
      (r) => r.analysis && filter.topics!.some((t) => r.analysis!.topics.includes(t)),
    )
  }

  return { rows: filtered, total: count ?? filtered.length, page: filter.page, pageSize: filter.pageSize }
}

export async function getMetricsRange(appId: string, from: Date, to: Date) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cc_app_metrics_daily')
    .select('store, date, average_rating, ratings_count, reviews_count, downloads, version')
    .eq('app_id', appId)
    .gte('date', from.toISOString().slice(0, 10))
    .lte('date', to.toISOString().slice(0, 10))
    .order('date', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getLatestExecutiveSummary(appId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cc_executive_summaries')
    .select('id, period_start, period_end, highlights, model, created_at')
    .eq('app_id', appId)
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getSyncState(appId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cc_app_sync_state')
    .select('store, last_synced_at, last_error')
    .eq('app_id', appId)
  if (error) throw error
  return data ?? []
}

async function fetchMetricsInWindow(
  appId: string,
  store: Store,
  sinceDays: number,
): Promise<MetricsRowLike[]> {
  const supabase = await createClient()
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)
  const { data, error } = await supabase
    .from('cc_app_metrics_daily')
    .select(
      'date, country_code, device_type, installs, uninstalls, average_rating, ratings_count',
    )
    .eq('app_id', appId)
    .eq('store', store)
    .gte('date', since.toISOString().slice(0, 10))
  if (error) throw error
  return (data ?? []) as MetricsRowLike[]
}

export async function listMetricsByCountry(
  appId: string,
  store: Store,
  sinceDays: number,
): Promise<CountryAggregate[]> {
  const rows = await fetchMetricsInWindow(appId, store, sinceDays)
  return aggregateMetricsByCountry(rows)
}

export async function listMetricsByDevice(
  appId: string,
  store: Store,
  sinceDays: number,
): Promise<DeviceAggregate[]> {
  const rows = await fetchMetricsInWindow(appId, store, sinceDays)
  return aggregateMetricsByDevice(rows)
}

export async function listAggregatedDailyMetrics(
  appId: string,
  store: Store,
  sinceDays: number,
): Promise<DailyAggregate[]> {
  const rows = await fetchMetricsInWindow(appId, store, sinceDays)
  return aggregateDailyMetrics(rows)
}
