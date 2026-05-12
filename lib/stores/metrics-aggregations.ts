import type { DeviceType } from './types'

export interface MetricsRowLike {
  date: string
  country_code: string | null
  device_type: string | null
  installs: number | null
  uninstalls: number | null
  average_rating: number | null
  ratings_count: number | null
}

export interface CountryAggregate {
  countryCode: string
  installs: number
  uninstalls: number
}

export interface DeviceAggregate {
  deviceType: DeviceType
  installs: number
}

export interface DailyAggregate {
  date: string
  installs: number
  uninstalls: number
  averageRating: number | null
}

const VALID_DEVICE_TYPES: ReadonlySet<DeviceType> = new Set([
  'PHONE',
  'TABLET',
  'TV',
  'WEAR',
  'OTHER',
])

function asDeviceType(s: string): DeviceType {
  return VALID_DEVICE_TYPES.has(s as DeviceType) ? (s as DeviceType) : 'OTHER'
}

export function aggregateMetricsByCountry(
  rows: MetricsRowLike[],
  topN = 10,
): CountryAggregate[] {
  const totals = new Map<string, { installs: number; uninstalls: number }>()
  for (const row of rows) {
    if (!row.country_code) continue
    const cur = totals.get(row.country_code) ?? { installs: 0, uninstalls: 0 }
    cur.installs += row.installs ?? 0
    cur.uninstalls += row.uninstalls ?? 0
    totals.set(row.country_code, cur)
  }
  return Array.from(totals.entries())
    .map(([countryCode, v]) => ({ countryCode, ...v }))
    .sort((a, b) => b.installs - a.installs)
    .slice(0, topN)
}

export function aggregateMetricsByDevice(rows: MetricsRowLike[]): DeviceAggregate[] {
  const totals = new Map<DeviceType, number>()
  for (const row of rows) {
    if (!row.device_type) continue
    const dt = asDeviceType(row.device_type)
    totals.set(dt, (totals.get(dt) ?? 0) + (row.installs ?? 0))
  }
  return Array.from(totals.entries())
    .map(([deviceType, installs]) => ({ deviceType, installs }))
    .sort((a, b) => b.installs - a.installs)
}

export function aggregateDailyMetrics(rows: MetricsRowLike[]): DailyAggregate[] {
  type Acc = { installs: number; uninstalls: number; ratingSum: number; ratingsCount: number }
  const byDate = new Map<string, Acc>()
  for (const row of rows) {
    const cur = byDate.get(row.date) ?? {
      installs: 0,
      uninstalls: 0,
      ratingSum: 0,
      ratingsCount: 0,
    }
    if (row.device_type != null && row.installs != null) {
      cur.installs += row.installs
      cur.uninstalls += row.uninstalls ?? 0
    }
    if (row.device_type == null && row.average_rating != null && row.ratings_count != null) {
      cur.ratingSum += row.average_rating * row.ratings_count
      cur.ratingsCount += row.ratings_count
    }
    byDate.set(row.date, cur)
  }
  return Array.from(byDate.entries())
    .map(([date, v]) => ({
      date,
      installs: v.installs,
      uninstalls: v.uninstalls,
      averageRating: v.ratingsCount > 0 ? v.ratingSum / v.ratingsCount : null,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
