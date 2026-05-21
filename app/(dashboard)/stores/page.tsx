import { after } from 'next/server'
import { getTranslations } from 'next-intl/server'
import { requireModuleRead } from '@/lib/auth/guards'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { listApps } from '@/lib/stores/repository'
import { syncIfStale } from '@/lib/stores/sync-service'
import { KpiCards, type KpiData } from './_components/kpi-cards'
import { RatingsTrendChart, type TrendPoint } from './_components/ratings-trend-chart'
import { ReviewsVolumeChart, type VolumePoint } from './_components/reviews-volume-chart'
import type { Store } from '@/lib/stores/types'

const TREND_DAYS = 30

interface ReviewSnapshot {
  store: Store
  rating: number
  created_at_store: string
}

export default async function StoresPage() {
  await requireModuleRead('stores')
  const t = await getTranslations('stores')
  const apps = await listApps()
  if (apps.length === 0) return null

  const app = apps[0]!
  const supabase = await createClient()

  const since = new Date(Date.now() - TREND_DAYS * 24 * 60 * 60 * 1000)
  const sinceIso = since.toISOString()

  const { data: reviews30d } = await supabase
    .from('cc_reviews')
    .select('store, rating, created_at_store')
    .eq('app_id', app.id)
    .gte('created_at_store', sinceIso)
    .order('created_at_store', { ascending: true })
    .returns<ReviewSnapshot[]>()

  const samples: ReviewSnapshot[] = reviews30d ?? []

  after(() => {
    syncIfStale(app.id).catch(() => {
      // Background sync — never throws to caller. Errors are persisted to
      // cc_app_sync_state.last_error by the sync-service itself.
    })
  })

  const kpis = computeKpis(samples)
  const trend = computeTrend(samples, TREND_DAYS)
  const volume = computeVolume(samples, TREND_DAYS)

  return (
    <div className="space-y-6">
      <KpiCards data={kpis} />

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('charts.ratingsTrend')}</CardTitle>
            <CardDescription>{t('charts.ratingsTrendDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <RatingsTrendChart data={trend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('charts.reviewsVolume')}</CardTitle>
            <CardDescription>{t('charts.reviewsVolumeDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ReviewsVolumeChart data={volume} />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function computeKpis(samples: ReviewSnapshot[]): KpiData {
  const play = samples.filter((s) => s.store === 'play')
  const appStore = samples.filter((s) => s.store === 'app_store')
  const negatives = samples.filter((s) => s.rating <= 2).length

  return {
    ratingPlay: play.length === 0 ? null : avg(play.map((s) => s.rating)),
    ratingAppStore: appStore.length === 0 ? null : avg(appStore.map((s) => s.rating)),
    reviewsLast30d: samples.length,
    negativeRatePct: samples.length === 0 ? null : (negatives / samples.length) * 100,
  }
}

function computeTrend(samples: ReviewSnapshot[], days: number): TrendPoint[] {
  const buckets = buildDayBuckets(days)
  const sums: Record<
    string,
    { play: { sum: number; n: number }; app_store: { sum: number; n: number } }
  > = {}
  for (const day of buckets) {
    sums[day] = { play: { sum: 0, n: 0 }, app_store: { sum: 0, n: 0 } }
  }
  for (const s of samples) {
    const day = s.created_at_store.slice(0, 10)
    if (!sums[day]) continue
    sums[day][s.store].sum += s.rating
    sums[day][s.store].n += 1
  }
  return buckets.map((date) => ({
    date,
    play: sums[date]!.play.n === 0 ? null : sums[date]!.play.sum / sums[date]!.play.n,
    app_store:
      sums[date]!.app_store.n === 0 ? null : sums[date]!.app_store.sum / sums[date]!.app_store.n,
  }))
}

function computeVolume(samples: ReviewSnapshot[], days: number): VolumePoint[] {
  const buckets = buildDayBuckets(days)
  const counts: Record<string, { play: number; app_store: number }> = {}
  for (const day of buckets) counts[day] = { play: 0, app_store: 0 }
  for (const s of samples) {
    const day = s.created_at_store.slice(0, 10)
    if (counts[day]) counts[day][s.store] += 1
  }
  return buckets.map((date) => ({
    date,
    play: counts[date]!.play,
    app_store: counts[date]!.app_store,
  }))
}

function buildDayBuckets(days: number): string[] {
  const out: string[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(today.getUTCDate() - i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

function avg(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length
}
