import { describe, expect, it, vi } from 'vitest'
import type { StrapiClient } from '../client'
import {
  createBannerSuperApp,
  deleteBannerSuperApp,
  publishBannerSuperApp,
  unpublishBannerSuperApp,
  updateBannerSuperApp,
} from './banner-super-app'

function makeImage(): File {
  return new File([new Uint8Array(100)], 'img.png', { type: 'image/png' })
}

const mediaResponse = (id: number) => ({
  ok: true as const,
  data: {
    id,
    url: `https://strapi.test/uploads/${id}.png`,
    mime: 'image/png',
    size: 100,
    name: 'img.png',
    alternativeText: null,
  },
})

describe('createBannerSuperApp', () => {
  it('uploads image first, then creates entry with media id', async () => {
    const client = {
      upload: vi.fn().mockResolvedValue(mediaResponse(99)),
      create: vi.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    } as unknown as StrapiClient

    const result = await createBannerSuperApp(client, {
      name: 'Test',
      url: 'https://example.com',
      position: 'block-1',
      image: makeImage(),
      order: 5,
    })

    expect(client.upload).toHaveBeenCalledTimes(1)
    expect(client.create).toHaveBeenCalledTimes(1)
    expect(client.create).toHaveBeenCalledWith('banner-super-apps', {
      name: 'Test',
      url: 'https://example.com',
      position: 'block-1',
      image: 99,
      order: 5,
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data?.id).toBe(1)
  })

  it('does NOT call create when upload fails', async () => {
    const client = {
      upload: vi.fn().mockResolvedValue({ ok: false, error: 'too big', status: 413 }),
      create: vi.fn(),
    } as unknown as StrapiClient

    const result = await createBannerSuperApp(client, {
      position: 'block-1',
      image: makeImage(),
      order: 0,
    })

    expect(client.upload).toHaveBeenCalled()
    expect(client.create).not.toHaveBeenCalled()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('too big')
  })

  it('omits empty/null name and url from payload', async () => {
    const create = vi.fn().mockResolvedValue({ ok: true, data: { id: 1 } })
    const client = {
      upload: vi.fn().mockResolvedValue(mediaResponse(99)),
      create,
    } as unknown as StrapiClient

    await createBannerSuperApp(client, {
      name: null,
      url: '',
      position: 'block-2',
      image: makeImage(),
      order: 0,
    })

    const payload = create.mock.calls[0]![1] as Record<string, unknown>
    expect(payload).not.toHaveProperty('name')
    expect(payload).not.toHaveProperty('url')
  })

  it('surfaces error from client.create', async () => {
    const client = {
      upload: vi.fn().mockResolvedValue(mediaResponse(99)),
      create: vi.fn().mockResolvedValue({ ok: false, error: 'duplicate slug' }),
    } as unknown as StrapiClient

    const result = await createBannerSuperApp(client, {
      position: 'block-1',
      image: makeImage(),
      order: 0,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('duplicate')
  })
})

describe('updateBannerSuperApp', () => {
  const noActions = {
    listPublisherActions: vi.fn().mockResolvedValue({ ok: true, data: [] }),
  }

  it('updates without uploading when image is omitted', async () => {
    const update = vi.fn().mockResolvedValue({ ok: true, data: { id: 1 } })
    const client = {
      upload: vi.fn(),
      update,
      ...noActions,
    } as unknown as StrapiClient

    await updateBannerSuperApp(client, 1, {
      name: 'New name',
      position: 'block-3',
      order: 2,
    })

    expect(client.upload).not.toHaveBeenCalled()
    const payload = update.mock.calls[0]![2] as Record<string, unknown>
    expect(payload).not.toHaveProperty('image')
  })

  it('uploads new image and includes media id when image provided', async () => {
    const update = vi.fn().mockResolvedValue({ ok: true, data: { id: 1 } })
    const client = {
      upload: vi.fn().mockResolvedValue(mediaResponse(50)),
      update,
      ...noActions,
    } as unknown as StrapiClient

    await updateBannerSuperApp(client, 1, {
      name: 'X',
      position: 'block-1',
      image: makeImage(),
      order: 0,
    })

    expect(client.upload).toHaveBeenCalledTimes(1)
    const payload = update.mock.calls[0]![2] as Record<string, unknown>
    expect(payload.image).toBe(50)
  })
})

describe('deleteBannerSuperApp', () => {
  it('delegates to client.delete', async () => {
    const del = vi.fn().mockResolvedValue({ ok: true, data: undefined })
    const client = { delete: del } as unknown as StrapiClient

    const result = await deleteBannerSuperApp(client, 7)

    expect(del).toHaveBeenCalledWith('banner-super-apps', 7)
    expect(result.ok).toBe(true)
  })

  it('surfaces delete errors', async () => {
    const client = {
      delete: vi.fn().mockResolvedValue({ ok: false, error: 'not found' }),
    } as unknown as StrapiClient

    const result = await deleteBannerSuperApp(client, 7)
    expect(result.ok).toBe(false)
  })
})

describe('publish/unpublishBannerSuperApp', () => {
  it('publish delegates', async () => {
    const client = {
      publish: vi.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    } as unknown as StrapiClient
    await publishBannerSuperApp(client, 1)
    expect(client.publish).toHaveBeenCalledWith('banner-super-apps', 1)
  })

  it('unpublish delegates', async () => {
    const client = {
      unpublish: vi.fn().mockResolvedValue({ ok: true, data: { id: 1 } }),
    } as unknown as StrapiClient
    await unpublishBannerSuperApp(client, 1)
    expect(client.unpublish).toHaveBeenCalledWith('banner-super-apps', 1)
  })
})
