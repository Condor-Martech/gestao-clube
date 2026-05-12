import { describe, expect, it } from 'vitest'
import {
  NumeroDaSorteCreateSchema,
  NumeroDaSorteUpdateSchema,
} from './numero-da-sorte'

function makeImage(
  opts: { name?: string; type?: string; size?: number } = {},
): File {
  const { name = 'banner.png', type = 'image/png', size = 1024 } = opts
  return new File([new Uint8Array(size)], name, { type })
}
function makePdf(opts: { name?: string; size?: number } = {}): File {
  const { name = 'regulamento.pdf', size = 2048 } = opts
  return new File([new Uint8Array(size)], name, { type: 'application/pdf' })
}

const validInput = () => ({
  titulo: 'Sorteio Junho',
  numeroCampanha: 12345,
  startDate: '2026-06-01',
  endDate: '2026-06-30',
  banner: makeImage(),
  regulamento: makePdf(),
})

describe('NumeroDaSorteCreateSchema', () => {
  it('accepts a valid input', () => {
    const result = NumeroDaSorteCreateSchema.safeParse(validInput())
    expect(result.success).toBe(true)
  })

  it('rejects inverted date range', () => {
    const result = NumeroDaSorteCreateSchema.safeParse({
      ...validInput(),
      startDate: '2026-06-10',
      endDate: '2026-06-05',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path.includes('endDate')),
      ).toBe(true)
    }
  })

  it('accepts equal start and end dates', () => {
    const result = NumeroDaSorteCreateSchema.safeParse({
      ...validInput(),
      startDate: '2026-06-15',
      endDate: '2026-06-15',
    })
    expect(result.success).toBe(true)
  })

  it('rejects PNG as regulamento', () => {
    const png = new File([new Uint8Array(1024)], 'doc.png', {
      type: 'image/png',
    })
    const result = NumeroDaSorteCreateSchema.safeParse({
      ...validInput(),
      regulamento: png,
    })
    expect(result.success).toBe(false)
  })

  it('rejects PDF as banner', () => {
    const pdf = new File([new Uint8Array(1024)], 'banner.pdf', {
      type: 'application/pdf',
    })
    const result = NumeroDaSorteCreateSchema.safeParse({
      ...validInput(),
      banner: pdf,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative numeroCampanha', () => {
    const result = NumeroDaSorteCreateSchema.safeParse({
      ...validInput(),
      numeroCampanha: -10,
    })
    expect(result.success).toBe(false)
  })

  it('rejects zero numeroCampanha', () => {
    const result = NumeroDaSorteCreateSchema.safeParse({
      ...validInput(),
      numeroCampanha: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty titulo', () => {
    const result = NumeroDaSorteCreateSchema.safeParse({
      ...validInput(),
      titulo: '',
    })
    expect(result.success).toBe(false)
  })

  it('allows omitting banner_small (it is optional)', () => {
    const result = NumeroDaSorteCreateSchema.safeParse(validInput())
    expect(result.success).toBe(true)
  })

  it('accepts banner_small as image', () => {
    const result = NumeroDaSorteCreateSchema.safeParse({
      ...validInput(),
      bannerSmall: makeImage({ name: 'small.jpg', type: 'image/jpeg' }),
    })
    expect(result.success).toBe(true)
  })

  it('rejects banner_small as PDF', () => {
    const pdf = new File([new Uint8Array(1024)], 'small.pdf', {
      type: 'application/pdf',
    })
    const result = NumeroDaSorteCreateSchema.safeParse({
      ...validInput(),
      bannerSmall: pdf,
    })
    expect(result.success).toBe(false)
  })

  it('rejects oversized PDF (> 10MB)', () => {
    const big = makePdf({ size: 11 * 1024 * 1024 })
    const result = NumeroDaSorteCreateSchema.safeParse({
      ...validInput(),
      regulamento: big,
    })
    expect(result.success).toBe(false)
  })

  it('rejects malformed dates', () => {
    const result = NumeroDaSorteCreateSchema.safeParse({
      ...validInput(),
      startDate: '06/01/2026',
    })
    expect(result.success).toBe(false)
  })
})

describe('NumeroDaSorteUpdateSchema', () => {
  it('banner and regulamento become optional on update', () => {
    const result = NumeroDaSorteUpdateSchema.safeParse({
      titulo: 'Sorteio Junho',
      numeroCampanha: 12345,
      startDate: '2026-06-01',
      endDate: '2026-06-30',
    })
    expect(result.success).toBe(true)
  })

  it('still enforces date refinement on update', () => {
    const result = NumeroDaSorteUpdateSchema.safeParse({
      titulo: 'X',
      numeroCampanha: 1,
      startDate: '2026-06-10',
      endDate: '2026-06-01',
    })
    expect(result.success).toBe(false)
  })
})
