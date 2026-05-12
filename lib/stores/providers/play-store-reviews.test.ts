import { describe, expect, it } from 'vitest'
import { parsePlayReviews } from './play-store-reviews'

describe('parsePlayReviews', () => {
  it('maps the first userComment of each review into ReviewRecord', () => {
    const fixture = {
      reviews: [
        {
          reviewId: 'review-abc',
          authorName: 'María',
          comments: [
            {
              userComment: {
                text: 'Buena app pero crashea',
                starRating: 3,
                reviewerLanguage: 'pt_BR',
                appVersionName: '2.4.1',
                lastModified: { seconds: '1714521600' },
              },
            },
          ],
        },
      ],
    }

    const result = parsePlayReviews(fixture)
    expect(result).toEqual([
      {
        externalId: 'review-abc',
        rating: 3,
        title: null,
        body: 'Buena app pero crashea',
        author: 'María',
        lang: 'pt_BR',
        version: '2.4.1',
        createdAtStore: new Date(1714521600 * 1000),
      },
    ])
  })

  it('skips reviews that have no userComment (developer-only replies)', () => {
    const fixture = {
      reviews: [
        {
          reviewId: 'reply-only',
          comments: [
            { developerComment: { text: 'Thanks!', lastModified: { seconds: '0' } } },
          ],
        },
      ],
    }
    expect(parsePlayReviews(fixture)).toEqual([])
  })

  it('handles missing fields gracefully', () => {
    const fixture = {
      reviews: [
        {
          reviewId: 'minimal',
          comments: [{ userComment: { lastModified: { seconds: 0 } } }],
        },
      ],
    }
    const [r] = parsePlayReviews(fixture)
    expect(r?.body).toBe(null)
    expect(r?.lang).toBe(null)
    expect(r?.version).toBe(null)
    expect(r?.rating).toBe(0)
  })

  it('returns empty when reviews field is missing', () => {
    expect(parsePlayReviews({})).toEqual([])
  })
})
