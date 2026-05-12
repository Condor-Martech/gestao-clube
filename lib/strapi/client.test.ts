import { describe, expect, it, vi } from 'vitest'
import { createStrapiClient } from './client'

const URL_BASE = 'https://strapi.test'
const TOKEN = 'test-token'

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    ...init,
  })
}

function makeClient(fetchFn: typeof fetch) {
  return createStrapiClient({ url: URL_BASE, token: TOKEN, fetchFn })
}

describe('StrapiClient.list', () => {
  it('sends Authorization: Bearer header', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({ data: [] }),
    )
    const client = makeClient(fetchMock)
    await client.list('banner-super-apps')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const init = fetchMock.mock.calls[0]![1] as RequestInit
    expect(init.headers).toMatchObject({
      Authorization: `Bearer ${TOKEN}`,
    })
  })

  it('builds URL with query params', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({ data: [] }),
    )
    const client = makeClient(fetchMock)
    await client.list('banner-super-apps', {
      'pagination[pageSize]': 100,
      populate: '*',
    })

    const url = String(fetchMock.mock.calls[0]![0])
    expect(url).toContain('https://strapi.test/api/banner-super-apps')
    expect(url).toContain('populate=*')
    expect(url).toContain('pagination%5BpageSize%5D=100')
  })

  it('returns ok=true with unwrapped data array', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ data: [{ id: 1 }, { id: 2 }] }))
    const client = makeClient(fetchMock)
    const result = await client.list<{ id: number }>('foo')

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toHaveLength(2)
    }
  })

  it('normalizes 4xx errors to ok=false with status', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(
        { error: { message: 'Forbidden' } },
        { status: 403, statusText: 'Forbidden' },
      ),
    )
    const client = makeClient(fetchMock)
    const result = await client.list('foo')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('Forbidden')
      expect(result.status).toBe(403)
    }
  })

  it('normalizes network errors to ok=false', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error('boom'))
    const client = makeClient(fetchMock)
    const result = await client.list('foo')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('boom')
    }
  })
})

describe('StrapiClient.create / update / delete', () => {
  it('create POSTs with { data } envelope', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ data: { id: 1 } }))
    const client = makeClient(fetchMock)
    await client.create('banner-super-apps', {
      name: 'Test',
      position: 'block-1',
    })

    const [url, init] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe('https://strapi.test/api/banner-super-apps')
    expect((init as RequestInit).method).toBe('POST')
    const body = JSON.parse((init as RequestInit).body as string) as {
      data: unknown
    }
    expect(body).toEqual({ data: { name: 'Test', position: 'block-1' } })
  })

  it('update PUTs to /:id with data envelope', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ data: { id: 1 } }))
    const client = makeClient(fetchMock)
    await client.update('banner-super-apps', 1, { name: 'X' })

    const [url, init] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe('https://strapi.test/api/banner-super-apps/1')
    expect((init as RequestInit).method).toBe('PUT')
  })

  it('delete sends DELETE', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ data: null }))
    const client = makeClient(fetchMock)
    const result = await client.delete('banner-super-apps', 1)

    expect(result.ok).toBe(true)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe('https://strapi.test/api/banner-super-apps/1')
    expect((init as RequestInit).method).toBe('DELETE')
  })
})

describe('StrapiClient.upload', () => {
  it('POSTs FormData to /api/upload and returns absolute media URL', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse([
        {
          id: 42,
          url: '/uploads/x.png',
          mime: 'image/png',
          size: 100,
          name: 'x.png',
          alternativeText: null,
        },
      ]),
    )
    const client = makeClient(fetchMock)
    const file = new File([new Uint8Array(10)], 'x.png', { type: 'image/png' })
    const result = await client.upload(file)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.id).toBe(42)
      expect(result.data.url).toBe('https://strapi.test/uploads/x.png')
    }

    const [url, init] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe('https://strapi.test/api/upload')
    expect((init as RequestInit).method).toBe('POST')
    expect((init as RequestInit).body).toBeInstanceOf(FormData)
    // FormData uploads must NOT set Content-Type (boundary is automatic)
    expect((init as RequestInit).headers).not.toHaveProperty('Content-Type')
  })

  it('does not modify already-absolute media URLs', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse([
        {
          id: 1,
          url: 'https://cdn.example.com/x.png',
          mime: 'image/png',
          size: 1,
          name: 'x.png',
        },
      ]),
    )
    const client = makeClient(fetchMock)
    const file = new File([new Uint8Array(1)], 'x.png', { type: 'image/png' })
    const result = await client.upload(file)

    if (result.ok) {
      expect(result.data.url).toBe('https://cdn.example.com/x.png')
    }
  })

  it('normalizes upload failure', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(
        { error: { message: 'File too large' } },
        { status: 413 },
      ),
    )
    const client = makeClient(fetchMock)
    const file = new File([new Uint8Array(1)], 'x.png', { type: 'image/png' })
    const result = await client.upload(file)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('File too large')
    }
  })
})

describe('StrapiClient.publish (v5 first, fallback v4)', () => {
  it('tries v5 endpoint first', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        jsonResponse({ data: { id: 7, publishedAt: '2026-01-01' } }),
      )
    const client = makeClient(fetchMock)
    await client.publish('banner-super-apps', 7)

    const [url, init] = fetchMock.mock.calls[0]!
    expect(String(url)).toContain(
      '/api/banner-super-apps/7/actions/publish',
    )
    expect((init as RequestInit).method).toBe('POST')
  })

  it('falls back to v4 PUT on 404', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({ error: 'not found' }, { status: 404 }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: { id: 7 } }))
    const client = makeClient(fetchMock)
    const result = await client.publish('banner-super-apps', 7)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const init2 = fetchMock.mock.calls[1]![1] as RequestInit
    expect(init2.method).toBe('PUT')
    expect(String(init2.body)).toContain('publishedAt')
    expect(result.ok).toBe(true)
  })

  it('does NOT fall back on non-404 errors (e.g., 401)', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({ error: 'unauthorized' }, { status: 401 }),
      )
    const client = makeClient(fetchMock)
    const result = await client.publish('banner-super-apps', 7)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result.ok).toBe(false)
  })
})

describe('StrapiClient.listPublisherActions', () => {
  it('builds URL with entitySlug and entityId filters', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ data: [] }))
    const client = makeClient(fetchMock)
    await client.listPublisherActions({
      entitySlug: 'api::numero-da-sorte.numero-da-sorte',
      entityId: 17,
    })

    const url = String(fetchMock.mock.calls[0]![0])
    expect(url).toContain('/api/publisher/actions')
    expect(url).toContain('filters%5BentitySlug%5D%5B%24eq%5D=api%3A%3Anumero-da-sorte.numero-da-sorte')
    expect(url).toContain('filters%5BentityId%5D%5B%24eq%5D=17')
  })

  it('omits filters when not provided', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ data: [] }))
    const client = makeClient(fetchMock)
    await client.listPublisherActions()

    const url = String(fetchMock.mock.calls[0]![0])
    expect(url).toContain('/api/publisher/actions')
    expect(url).not.toContain('filters%5B')
  })

  it('returns array of raw action envelopes', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        data: [
          {
            id: 651,
            attributes: {
              executeAt: '2027-02-28T03:00:00.000Z',
              mode: 'unpublish',
              entityId: 17,
              entitySlug: 'api::numero-da-sorte.numero-da-sorte',
            },
          },
        ],
      }),
    )
    const client = makeClient(fetchMock)
    const result = await client.listPublisherActions<{
      id: number
      attributes: { executeAt: string }
    }>({ entitySlug: 'api::numero-da-sorte.numero-da-sorte' })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toHaveLength(1)
      expect(result.data[0]!.id).toBe(651)
    }
  })
})

describe('StrapiClient.unpublish', () => {
  it('falls back to v4 PUT setting publishedAt to null', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({ error: 'not found' }, { status: 404 }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: { id: 7 } }))
    const client = makeClient(fetchMock)
    await client.unpublish('banner-super-apps', 7)

    const init2 = fetchMock.mock.calls[1]![1] as RequestInit
    const body = JSON.parse(init2.body as string) as {
      data: { publishedAt: null }
    }
    expect(body.data.publishedAt).toBeNull()
  })
})
