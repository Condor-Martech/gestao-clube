import { describe, expect, it } from 'vitest'
import { parseAppStoreReviews } from './app-store'

describe('parseAppStoreReviews', () => {
  it('maps every review attribute into ReviewRecord shape', () => {
    const fixture = {
      data: [
        {
          id: 'rev-1',
          attributes: {
            rating: 5,
            title: 'Excelente',
            body: 'Funciona muy bien',
            reviewerNickname: 'Juan',
            createdDate: '2026-04-15T10:00:00Z',
            territory: 'BRA',
          },
        },
        {
          id: 'rev-2',
          attributes: {
            rating: 1,
            title: null,
            body: 'No abre',
            reviewerNickname: null,
            createdDate: '2026-04-10T08:30:00Z',
            territory: null,
          },
        },
      ],
    }

    const result = parseAppStoreReviews(fixture)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      externalId: 'rev-1',
      rating: 5,
      title: 'Excelente',
      body: 'Funciona muy bien',
      author: 'Juan',
      lang: null,
      version: null,
      createdAtStore: new Date('2026-04-15T10:00:00Z'),
    })
    expect(result[1]?.author).toBe(null)
    expect(result[1]?.rating).toBe(1)
  })

  it('returns an empty array when data is empty', () => {
    expect(parseAppStoreReviews({ data: [] })).toEqual([])
  })

  it('preserves chronological ordering from the API', () => {
    const fixture = {
      data: [
        {
          id: 'a',
          attributes: {
            rating: 5,
            title: null,
            body: null,
            reviewerNickname: null,
            createdDate: '2026-04-15T00:00:00Z',
            territory: null,
          },
        },
        {
          id: 'b',
          attributes: {
            rating: 5,
            title: null,
            body: null,
            reviewerNickname: null,
            createdDate: '2026-04-10T00:00:00Z',
            territory: null,
          },
        },
      ],
    }
    const result = parseAppStoreReviews(fixture)
    expect(result.map((r) => r.externalId)).toEqual(['a', 'b'])
  })
})
