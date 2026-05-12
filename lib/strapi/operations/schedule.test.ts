import { describe, expect, it, vi } from 'vitest'
import type { StrapiClient } from '../client'
import { syncSchedule } from './schedule'

const SLUG = 'api::numero-da-sorte.numero-da-sorte'

function makeClient(
  overrides: Partial<StrapiClient> = {},
): StrapiClient {
  return {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    publish: vi.fn(),
    unpublish: vi.fn(),
    upload: vi.fn(),
    listPublisherActions: vi.fn().mockResolvedValue({ ok: true, data: [] }),
    ...overrides,
  } as unknown as StrapiClient
}

function rawAction(
  mode: 'publish' | 'unpublish',
  executeAt: string,
  id = 1,
) {
  return {
    id,
    attributes: { mode, executeAt, entityId: 17, entitySlug: SLUG },
  }
}

describe('syncSchedule', () => {
  it('no-op when both empty and no existing', async () => {
    const client = makeClient()
    const r = await syncSchedule(client, SLUG, 17, {})
    expect(r.ok).toBe(true)
    expect(client.create).not.toHaveBeenCalled()
    expect(client.update).not.toHaveBeenCalled()
    expect(client.delete).not.toHaveBeenCalled()
  })

  it('creates a new publish action when desired set and none existing', async () => {
    const create = vi.fn().mockResolvedValue({ ok: true, data: { id: 99 } })
    const client = makeClient({ create })

    const r = await syncSchedule(client, SLUG, 17, {
      publishAt: '2026-06-01T00:00',
    })

    expect(r.ok).toBe(true)
    expect(create).toHaveBeenCalledWith('publisher/actions', {
      executeAt: '2026-06-01T03:00:00.000Z',
      mode: 'publish',
      entityId: 17,
      entitySlug: SLUG,
    })
  })

  it('updates the existing action when desired differs', async () => {
    const update = vi.fn().mockResolvedValue({ ok: true, data: { id: 42 } })
    const client = makeClient({
      listPublisherActions: vi.fn().mockResolvedValue({
        ok: true,
        data: [rawAction('unpublish', '2026-12-31T03:00:00.000Z', 42)],
      }),
      update,
    })

    const r = await syncSchedule(client, SLUG, 17, {
      unpublishAt: '2027-02-28T00:00',
    })

    expect(r.ok).toBe(true)
    expect(update).toHaveBeenCalledWith('publisher/actions', 42, {
      executeAt: '2027-02-28T03:00:00.000Z',
    })
  })

  it('skips update when desired matches existing exactly', async () => {
    const update = vi.fn()
    const client = makeClient({
      listPublisherActions: vi.fn().mockResolvedValue({
        ok: true,
        data: [rawAction('publish', '2026-06-01T03:00:00.000Z', 42)],
      }),
      update,
    })

    const r = await syncSchedule(client, SLUG, 17, {
      publishAt: '2026-06-01T00:00',
    })

    expect(r.ok).toBe(true)
    expect(update).not.toHaveBeenCalled()
  })

  it('deletes the existing action when desired is cleared', async () => {
    const del = vi.fn().mockResolvedValue({ ok: true, data: undefined })
    const client = makeClient({
      listPublisherActions: vi.fn().mockResolvedValue({
        ok: true,
        data: [rawAction('publish', '2026-06-01T03:00:00.000Z', 42)],
      }),
      delete: del,
    })

    const r = await syncSchedule(client, SLUG, 17, { publishAt: '' })

    expect(r.ok).toBe(true)
    expect(del).toHaveBeenCalledWith('publisher/actions', 42)
  })

  it('handles both publish and unpublish in a single call', async () => {
    const create = vi.fn().mockResolvedValue({ ok: true, data: { id: 99 } })
    const client = makeClient({ create })

    const r = await syncSchedule(client, SLUG, 17, {
      publishAt: '2026-06-01T00:00',
      unpublishAt: '2026-06-30T23:59',
    })

    expect(r.ok).toBe(true)
    expect(create).toHaveBeenCalledTimes(2)
  })

  it('aborts on first sub-call error', async () => {
    const client = makeClient({
      create: vi
        .fn()
        .mockResolvedValue({ ok: false, error: 'forbidden', status: 403 }),
    })

    const r = await syncSchedule(client, SLUG, 17, {
      publishAt: '2026-06-01T00:00',
    })

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('forbidden')
  })

  it('surfaces error from listPublisherActions', async () => {
    const client = makeClient({
      listPublisherActions: vi
        .fn()
        .mockResolvedValue({ ok: false, error: '401 Unauthorized', status: 401 }),
    })

    const r = await syncSchedule(client, SLUG, 17, {
      publishAt: '2026-06-01T00:00',
    })

    expect(r.ok).toBe(false)
  })
})
