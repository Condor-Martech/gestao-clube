import { describe, it, expect } from 'vitest'
import {
  aggregateMetricsByCountry,
  aggregateMetricsByDevice,
  aggregateDailyMetrics,
  type MetricsRowLike,
} from './metrics-aggregations'

function row(overrides: Partial<MetricsRowLike>): MetricsRowLike {
  return {
    date: '2026-05-01',
    country_code: null,
    device_type: null,
    installs: null,
    uninstalls: null,
    average_rating: null,
    ratings_count: null,
    ...overrides,
  }
}

describe('aggregateMetricsByCountry', () => {
  it('sums installs/uninstalls per country across multiple devices', () => {
    const rows = [
      row({ country_code: 'BR', device_type: 'PHONE', installs: 10, uninstalls: 1 }),
      row({ country_code: 'BR', device_type: 'TABLET', installs: 5, uninstalls: 0 }),
      row({ country_code: 'AR', device_type: 'PHONE', installs: 3, uninstalls: 2 }),
    ]
    expect(aggregateMetricsByCountry(rows)).toEqual([
      { countryCode: 'BR', installs: 15, uninstalls: 1 },
      { countryCode: 'AR', installs: 3, uninstalls: 2 },
    ])
  })

  it('skips rows without country_code', () => {
    const rows = [
      row({ country_code: null, device_type: 'PHONE', installs: 100 }),
      row({ country_code: 'BR', device_type: 'PHONE', installs: 5 }),
    ]
    expect(aggregateMetricsByCountry(rows)).toEqual([
      { countryCode: 'BR', installs: 5, uninstalls: 0 },
    ])
  })

  it('caps at topN parameter', () => {
    const rows = Array.from({ length: 15 }, (_, i) =>
      row({ country_code: `C${i}`, device_type: 'PHONE', installs: 100 - i }),
    )
    expect(aggregateMetricsByCountry(rows, 3)).toHaveLength(3)
  })

  it('returns empty for empty input', () => {
    expect(aggregateMetricsByCountry([])).toEqual([])
  })
})

describe('aggregateMetricsByDevice', () => {
  it('sums installs per device type across countries', () => {
    const rows = [
      row({ country_code: 'BR', device_type: 'PHONE', installs: 10 }),
      row({ country_code: 'AR', device_type: 'PHONE', installs: 5 }),
      row({ country_code: 'BR', device_type: 'TABLET', installs: 3 }),
    ]
    expect(aggregateMetricsByDevice(rows)).toEqual([
      { deviceType: 'PHONE', installs: 15 },
      { deviceType: 'TABLET', installs: 3 },
    ])
  })

  it('maps unknown device_type to OTHER', () => {
    const rows = [row({ country_code: 'BR', device_type: 'FOLDABLE', installs: 7 })]
    expect(aggregateMetricsByDevice(rows)).toEqual([{ deviceType: 'OTHER', installs: 7 }])
  })

  it('skips rating rows (device_type null)', () => {
    const rows = [
      row({ country_code: 'BR', device_type: null, average_rating: 4.5, ratings_count: 100 }),
    ]
    expect(aggregateMetricsByDevice(rows)).toEqual([])
  })
})

describe('aggregateDailyMetrics', () => {
  it('sums installs from device-tagged rows and computes weighted rating from device-null rows', () => {
    const rows = [
      row({ country_code: 'BR', device_type: 'PHONE', installs: 10, uninstalls: 1 }),
      row({ country_code: 'AR', device_type: 'PHONE', installs: 5, uninstalls: 0 }),
      row({ country_code: 'BR', device_type: null, average_rating: 4.0, ratings_count: 50 }),
      row({ country_code: 'AR', device_type: null, average_rating: 5.0, ratings_count: 10 }),
    ]
    const result = aggregateDailyMetrics(rows)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ date: '2026-05-01', installs: 15, uninstalls: 1 })
    expect(result[0].averageRating).toBeCloseTo(4.333, 2)
  })

  it('orders by date ascending', () => {
    const rows = [
      row({ date: '2026-05-03', country_code: 'BR', device_type: 'PHONE', installs: 1 }),
      row({ date: '2026-05-01', country_code: 'BR', device_type: 'PHONE', installs: 1 }),
      row({ date: '2026-05-02', country_code: 'BR', device_type: 'PHONE', installs: 1 }),
    ]
    expect(aggregateDailyMetrics(rows).map((r) => r.date)).toEqual([
      '2026-05-01',
      '2026-05-02',
      '2026-05-03',
    ])
  })

  it('returns null averageRating when no rating data', () => {
    const rows = [row({ country_code: 'BR', device_type: 'PHONE', installs: 10 })]
    expect(aggregateDailyMetrics(rows)[0].averageRating).toBeNull()
  })

  it('returns empty for empty input', () => {
    expect(aggregateDailyMetrics([])).toEqual([])
  })
})
