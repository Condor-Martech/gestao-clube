import { describe, expect, it, vi } from 'vitest'
import type { StrapiClient } from '../client'
import {
  createNumeroDaSorte,
  deleteNumeroDaSorte,
  publishNumeroDaSorte,
  unpublishNumeroDaSorte,
  updateNumeroDaSorte,
} from './numero-da-sorte'

function makeImage(): File {
  return new File([new Uint8Array(100)], 'img.png', { type: 'image/png' })
}
function makePdf(): File {
  return new File([new Uint8Array(200)], 'reg.pdf', {
    type: 'application/pdf',
  })
}

const mediaResponse = (id: number) => ({
  ok: true as const,
  data: {
    id,
    url: `https://strapi.test/uploads/${id}`,
    mime: 'image/png',
    size: 100,
    name: 'x',
    alternativeText: null,
  },
})

const validInput = () => ({
  titulo: 'Sorteio Junho',
  numeroCampanha: 12345,
  startDate: '2026-06-01',
  endDate: '2026-06-30',
  banner: makeImage(),
  regulamento: makePdf(),
})

describe('createNumeroDaSorte', () => {
  it('uploads 2 files (banner + regulamento) when no banner_small', async () => {
    let n = 0
    const create = vi.fn().mockResolvedValue({ ok: true, data: { id: 1 } })
    const client = {
      upload: vi.fn().mockImplementation(() => Promise.resolve(mediaResponse(++n))),
      create,
    } as unknown as StrapiClient

    const result = await createNumeroDaSorte(client, validInput())

    expect(client.upload).toHaveBeenCalledTimes(2)
    const payload = create.mock.calls[0]![1] as Record<string, unknown>
    expect(payload).toMatchObject({
      Titulo: 'Sorteio Junho',
      numeroCampanha: 12345,
      Start: '2026-06-01',
      End: '2026-06-30',
      Banner: 1,
      Regulamento: 2,
    })
    expect(payload).not.toHaveProperty('banner_small')
    expect(result.ok).toBe(true)
  })

  it('uploads 3 files when banner_small provided', async () => {
    let n = 0
    const create = vi.fn().mockResolvedValue({ ok: true, data: { id: 1 } })
    const client = {
      upload: vi.fn().mockImplementation(() => Promise.resolve(mediaResponse(++n))),
      create,
    } as unknown as StrapiClient

    await createNumeroDaSorte(client, {
      ...validInput(),
      bannerSmall: makeImage(),
    })

    expect(client.upload).toHaveBeenCalledTimes(3)
    const payload = create.mock.calls[0]![1] as Record<string, unknown>
    expect(payload).toMatchObject({
      Banner: 1,
      banner_small: 2,
      Regulamento: 3,
    })
  })

  it('aborts entry creation when any upload fails', async () => {
    let n = 0
    const client = {
      upload: vi.fn().mockImplementation(() => {
        n++
        if (n === 2) {
          return Promise.resolve({
            ok: false,
            error: 'pdf too large',
            status: 413,
          })
        }
        return Promise.resolve(mediaResponse(n))
      }),
      create: vi.fn(),
    } as unknown as StrapiClient

    const result = await createNumeroDaSorte(client, {
      ...validInput(),
      bannerSmall: makeImage(),
    })

    expect(client.create).not.toHaveBeenCalled()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('pdf too large')
  })

  it('surfaces strapi error on duplicate numeroCampanha', async () => {
    const client = {
      upload: vi.fn().mockResolvedValue(mediaResponse(1)),
      create: vi.fn().mockResolvedValue({
        ok: false,
        error: 'numeroCampanha must be unique',
        status: 400,
      }),
    } as unknown as StrapiClient

    const result = await createNumeroDaSorte(client, validInput())

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('unique')
  })
})

describe('updateNumeroDaSorte', () => {
  const noActions = {
    listPublisherActions: vi.fn().mockResolvedValue({ ok: true, data: [] }),
  }

  it('updates scalars without uploads when no media changed', async () => {
    const update = vi.fn().mockResolvedValue({ ok: true, data: { id: 1 } })
    const client = {
      upload: vi.fn(),
      update,
      ...noActions,
    } as unknown as StrapiClient

    await updateNumeroDaSorte(client, 1, {
      titulo: 'New title',
      numeroCampanha: 999,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    })

    expect(client.upload).not.toHaveBeenCalled()
    const payload = update.mock.calls[0]![2] as Record<string, unknown>
    expect(payload).not.toHaveProperty('Banner')
    expect(payload).not.toHaveProperty('Regulamento')
    expect(payload.Titulo).toBe('New title')
  })

  it('uploads only the files that changed', async () => {
    let n = 0
    const update = vi.fn().mockResolvedValue({ ok: true, data: { id: 1 } })
    const client = {
      upload: vi.fn().mockImplementation(() => Promise.resolve(mediaResponse(++n))),
      update,
      ...noActions,
    } as unknown as StrapiClient

    await updateNumeroDaSorte(client, 1, {
      titulo: 'X',
      numeroCampanha: 1,
      startDate: '2026-07-01',
      endDate: '2026-07-02',
      regulamento: makePdf(),
    })

    expect(client.upload).toHaveBeenCalledTimes(1)
    const payload = update.mock.calls[0]![2] as Record<string, unknown>
    expect(payload.Regulamento).toBe(1)
    expect(payload).not.toHaveProperty('Banner')
  })
})

describe('deleteNumeroDaSorte', () => {
  it('delegates to client.delete', async () => {
    const del = vi.fn().mockResolvedValue({ ok: true, data: undefined })
    const client = { delete: del } as unknown as StrapiClient
    const result = await deleteNumeroDaSorte(client, 5)
    expect(del).toHaveBeenCalledWith('numero-da-sortes', 5)
    expect(result.ok).toBe(true)
  })
})

describe('publish/unpublishNumeroDaSorte', () => {
  it('publish delegates', async () => {
    const client = {
      publish: vi.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    } as unknown as StrapiClient
    await publishNumeroDaSorte(client, 1)
    expect(client.publish).toHaveBeenCalledWith('numero-da-sortes', 1)
  })

  it('unpublish delegates', async () => {
    const client = {
      unpublish: vi.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    } as unknown as StrapiClient
    await unpublishNumeroDaSorte(client, 1)
    expect(client.unpublish).toHaveBeenCalledWith('numero-da-sortes', 1)
  })
})
