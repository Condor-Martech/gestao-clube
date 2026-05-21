import { describe, expect, it } from 'vitest'
import { brtLocalToUtcIso, utcIsoToBrtLocal } from './schedule'

describe('brtLocalToUtcIso', () => {
  it('shifts BRT wall-clock to UTC by +3h', () => {
    expect(brtLocalToUtcIso('2026-06-01T00:00')).toBe('2026-06-01T03:00:00.000Z')
  })

  it('handles end-of-day rollover into the next UTC day', () => {
    expect(brtLocalToUtcIso('2026-12-31T23:59')).toBe('2027-01-01T02:59:00.000Z')
  })

  it('matches the real Strapi sample (2027-02-28 BRT midnight)', () => {
    expect(brtLocalToUtcIso('2027-02-28T00:00')).toBe('2027-02-28T03:00:00.000Z')
  })
})

describe('utcIsoToBrtLocal', () => {
  it('shifts UTC to BRT wall-clock by -3h', () => {
    expect(utcIsoToBrtLocal('2027-02-28T03:00:00.000Z')).toBe('2027-02-28T00:00')
  })

  it('handles end-of-day rollover into the previous BRT day', () => {
    expect(utcIsoToBrtLocal('2026-04-01T02:59:00.000Z')).toBe('2026-03-31T23:59')
  })

  it('round-trips with brtLocalToUtcIso', () => {
    const original = '2026-06-15T14:30'
    expect(utcIsoToBrtLocal(brtLocalToUtcIso(original))).toBe(original)
  })
})
