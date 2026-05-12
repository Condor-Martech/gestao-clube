import { describe, expect, it } from 'vitest'
import {
  buildScheduleMap,
  mapBannerSuperApp,
  mapNumeroDaSorte,
  mapPublisherAction,
} from './mappers'
import type { PublisherAction } from '@/types/entities'

const MEDIA_BASE = 'https://strapi.test'

describe('mapBannerSuperApp', () => {
  it('maps Strapi v4 envelope shape (attributes + data wrappers)', () => {
    const v4 = {
      id: 1,
      attributes: {
        name: 'Banner X',
        slug: 'banner-x',
        url: 'https://target.com',
        position: 'block-1',
        order: 5,
        publishedAt: '2026-01-15T10:00:00.000Z',
        image: {
          data: {
            id: 42,
            attributes: {
              url: '/uploads/banner_x.png',
              alternativeText: 'Banner alt',
              mime: 'image/png',
              size: 12345,
              name: 'banner_x.png',
            },
          },
        },
      },
    }
    const r = mapBannerSuperApp(v4, MEDIA_BASE)
    expect(r).toMatchObject({
      id: 1,
      name: 'Banner X',
      slug: 'banner-x',
      url: 'https://target.com',
      position: 'block-1',
      order: 5,
      publishedAt: '2026-01-15T10:00:00.000Z',
    })
    expect(r.image.url).toBe('https://strapi.test/uploads/banner_x.png')
    expect(r.image.alt).toBe('Banner alt')
  })

  it('maps Strapi v5 flat shape', () => {
    const v5 = {
      id: 1,
      documentId: 'abc-123',
      name: 'Banner V5',
      slug: 'banner-v5',
      url: null,
      position: 'block-2',
      order: 0,
      publishedAt: null,
      image: {
        id: 7,
        url: '/uploads/v5.jpg',
        alternativeText: null,
        mime: 'image/jpeg',
        size: 999,
        name: 'v5.jpg',
      },
    }
    const r = mapBannerSuperApp(v5, MEDIA_BASE)
    expect(r.id).toBe(1)
    expect(r.name).toBe('Banner V5')
    expect(r.position).toBe('block-2')
    expect(r.publishedAt).toBeNull()
    expect(r.image.url).toBe('https://strapi.test/uploads/v5.jpg')
  })

  it('keeps already-absolute media URLs intact', () => {
    const v5 = {
      id: 1,
      slug: 's',
      position: 'block-1',
      order: 0,
      publishedAt: null,
      image: { url: 'https://cdn.example.com/x.png' },
    }
    const r = mapBannerSuperApp(v5, MEDIA_BASE)
    expect(r.image.url).toBe('https://cdn.example.com/x.png')
  })

  it('handles missing optional name and url', () => {
    const v5 = {
      id: 1,
      slug: 's',
      position: 'block-3',
      order: 0,
      publishedAt: null,
      image: { url: '/uploads/x.png' },
    }
    const r = mapBannerSuperApp(v5, MEDIA_BASE)
    expect(r.name).toBeNull()
    expect(r.url).toBeNull()
  })
})

describe('mapNumeroDaSorte', () => {
  it('maps v4 envelope with capitalized field names from Strapi', () => {
    const v4 = {
      id: 10,
      attributes: {
        Titulo: 'Sorteio Junho',
        numeroCampanha: '12345', // bigint comes as string sometimes
        Start: '2026-06-01',
        End: '2026-06-30',
        publishedAt: '2026-05-20T08:00:00.000Z',
        Banner: {
          data: { id: 1, attributes: { url: '/uploads/banner.png' } },
        },
        banner_small: {
          data: { id: 2, attributes: { url: '/uploads/small.png' } },
        },
        Regulamento: {
          data: { id: 3, attributes: { url: '/uploads/reg.pdf' } },
        },
      },
    }
    const r = mapNumeroDaSorte(v4, MEDIA_BASE)
    expect(r).toMatchObject({
      id: 10,
      titulo: 'Sorteio Junho',
      numeroCampanha: 12345,
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      publishedAt: '2026-05-20T08:00:00.000Z',
    })
    expect(r.banner.url).toBe('https://strapi.test/uploads/banner.png')
    expect(r.bannerSmall?.url).toBe('https://strapi.test/uploads/small.png')
    expect(r.regulamento.url).toBe('https://strapi.test/uploads/reg.pdf')
  })

  it('maps v5 flat shape', () => {
    const v5 = {
      id: 11,
      Titulo: 'Sorteio v5',
      numeroCampanha: 99,
      Start: '2026-07-01',
      End: '2026-07-31',
      publishedAt: null,
      Banner: { id: 1, url: '/uploads/b.png' },
      banner_small: null,
      Regulamento: { id: 2, url: '/uploads/r.pdf' },
    }
    const r = mapNumeroDaSorte(v5, MEDIA_BASE)
    expect(r.id).toBe(11)
    expect(r.numeroCampanha).toBe(99)
    expect(r.bannerSmall).toBeNull()
    expect(r.regulamento.url).toBe('https://strapi.test/uploads/r.pdf')
  })

  it('coerces numeroCampanha string to number', () => {
    const raw = {
      id: 1,
      Titulo: 'X',
      numeroCampanha: '777',
      Start: '2026-01-01',
      End: '2026-01-02',
      publishedAt: null,
      Banner: { url: '/u/b.png' },
      Regulamento: { url: '/u/r.pdf' },
    }
    const r = mapNumeroDaSorte(raw, MEDIA_BASE)
    expect(r.numeroCampanha).toBe(777)
    expect(typeof r.numeroCampanha).toBe('number')
  })
})

describe('mapPublisherAction', () => {
  it('flattens v4 envelope', () => {
    const raw = {
      id: 651,
      attributes: {
        executeAt: '2027-02-28T03:00:00.000Z',
        mode: 'unpublish',
        entityId: 17,
        entitySlug: 'api::numero-da-sorte.numero-da-sorte',
        createdAt: '2026-02-23T15:16:49.174Z',
        updatedAt: '2026-02-23T15:16:49.174Z',
      },
    }
    const r = mapPublisherAction(raw)
    expect(r).toEqual({
      id: 651,
      executeAt: '2027-02-28T03:00:00.000Z',
      mode: 'unpublish',
      entityId: 17,
      entitySlug: 'api::numero-da-sorte.numero-da-sorte',
    })
  })
})

describe('buildScheduleMap', () => {
  const action = (
    overrides: Partial<PublisherAction> = {},
  ): PublisherAction => ({
    id: 1,
    executeAt: '2026-06-01T03:00:00.000Z',
    mode: 'publish',
    entityId: 17,
    entitySlug: 'api::numero-da-sorte.numero-da-sorte',
    ...overrides,
  })

  it('groups publish + unpublish per entityId', () => {
    const map = buildScheduleMap([
      action({ id: 1, mode: 'publish', entityId: 17, executeAt: '2026-06-01T03:00:00.000Z' }),
      action({ id: 2, mode: 'unpublish', entityId: 17, executeAt: '2026-06-30T03:00:00.000Z' }),
      action({ id: 3, mode: 'publish', entityId: 18, executeAt: '2026-07-01T03:00:00.000Z' }),
    ])
    expect(map[17]).toEqual({
      publishAt: '2026-06-01T03:00:00.000Z',
      unpublishAt: '2026-06-30T03:00:00.000Z',
    })
    expect(map[18]).toEqual({ publishAt: '2026-07-01T03:00:00.000Z' })
  })

  it('keeps the latest action when same entity has multiple of same mode', () => {
    const map = buildScheduleMap([
      action({ id: 1, mode: 'unpublish', entityId: 17, executeAt: '2026-06-30T03:00:00.000Z' }),
      action({ id: 2, mode: 'unpublish', entityId: 17, executeAt: '2027-02-28T03:00:00.000Z' }),
    ])
    expect(map[17]?.unpublishAt).toBe('2027-02-28T03:00:00.000Z')
  })

  it('returns empty map for empty input', () => {
    expect(buildScheduleMap([])).toEqual({})
  })
})
