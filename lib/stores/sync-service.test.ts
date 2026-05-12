import { describe, expect, it } from 'vitest'
import { isFresh } from './sync-service'

describe('isFresh', () => {
  it('returns false when no last_synced_at', () => {
    expect(isFresh(null, 60)).toBe(false)
    expect(isFresh(undefined, 60)).toBe(false)
  })

  it('returns false for invalid date strings', () => {
    expect(isFresh('not-a-date', 60)).toBe(false)
  })

  it('returns true when within throttle window', () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60_000).toISOString()
    expect(isFresh(tenMinutesAgo, 60)).toBe(true)
  })

  it('returns false when older than throttle window', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60_000).toISOString()
    expect(isFresh(twoHoursAgo, 60)).toBe(false)
  })

  it('uses minutes (not seconds)', () => {
    const fortyFiveMinutesAgo = new Date(Date.now() - 45 * 60_000).toISOString()
    expect(isFresh(fortyFiveMinutesAgo, 30)).toBe(false)
    expect(isFresh(fortyFiveMinutesAgo, 60)).toBe(true)
  })
})
