import { describe, expect, it } from 'vitest'
import { BannerSuperAppCreateSchema, BannerSuperAppUpdateSchema } from './banner-super-app'

function makeImage(opts: { name?: string; type?: string; size?: number } = {}): File {
  const { name = 'banner.png', type = 'image/png', size = 1024 } = opts
  return new File([new Uint8Array(size)], name, { type })
}

describe('BannerSuperAppCreateSchema', () => {
  it('accepts a valid input', () => {
    const result = BannerSuperAppCreateSchema.safeParse({
      name: 'Oferta Natal',
      url: 'https://example.com',
      position: 'block-1',
      image: makeImage(),
      order: 0,
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid position (block-6)', () => {
    const result = BannerSuperAppCreateSchema.safeParse({
      position: 'block-6',
      image: makeImage(),
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid positions block-1..block-5', () => {
    for (const p of ['block-1', 'block-2', 'block-3', 'block-4', 'block-5']) {
      const result = BannerSuperAppCreateSchema.safeParse({
        position: p,
        image: makeImage(),
      })
      expect(result.success, `${p} should be valid`).toBe(true)
    }
  })

  it('rejects without image', () => {
    const result = BannerSuperAppCreateSchema.safeParse({
      position: 'block-1',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'image')).toBe(true)
    }
  })

  it('rejects oversized image (> 5MB)', () => {
    const big = makeImage({ size: 6 * 1024 * 1024 })
    const result = BannerSuperAppCreateSchema.safeParse({
      position: 'block-1',
      image: big,
    })
    expect(result.success).toBe(false)
  })

  it('rejects PDF as image', () => {
    const pdf = makeImage({ name: 'doc.pdf', type: 'application/pdf' })
    const result = BannerSuperAppCreateSchema.safeParse({
      position: 'block-1',
      image: pdf,
    })
    expect(result.success).toBe(false)
  })

  it('allows missing name (Strapi schema permits it)', () => {
    const result = BannerSuperAppCreateSchema.safeParse({
      position: 'block-2',
      image: makeImage(),
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid URL', () => {
    const result = BannerSuperAppCreateSchema.safeParse({
      position: 'block-1',
      image: makeImage(),
      url: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })

  it('accepts empty string for url (cleared field)', () => {
    const result = BannerSuperAppCreateSchema.safeParse({
      position: 'block-1',
      image: makeImage(),
      url: '',
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative order', () => {
    const result = BannerSuperAppCreateSchema.safeParse({
      position: 'block-1',
      image: makeImage(),
      order: -5,
    })
    expect(result.success).toBe(false)
  })

  it('defaults order to 0 when omitted', () => {
    const result = BannerSuperAppCreateSchema.safeParse({
      position: 'block-1',
      image: makeImage(),
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.order).toBe(0)
    }
  })
})

describe('BannerSuperAppUpdateSchema', () => {
  it('image becomes optional on update', () => {
    const result = BannerSuperAppUpdateSchema.safeParse({
      position: 'block-3',
    })
    expect(result.success).toBe(true)
  })

  it('still validates image when provided', () => {
    const pdf = makeImage({ name: 'doc.pdf', type: 'application/pdf' })
    const result = BannerSuperAppUpdateSchema.safeParse({
      position: 'block-1',
      image: pdf,
    })
    expect(result.success).toBe(false)
  })
})
