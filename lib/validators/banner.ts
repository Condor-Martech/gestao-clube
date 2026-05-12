import { z } from 'zod'

const SLUG_REGEX = /^[a-z0-9-]+$/

export const BannerSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200),
  slug: z
    .string()
    .min(2, 'Slug muito curto')
    .max(80)
    .regex(SLUG_REGEX, 'Apenas minúsculas, números e hífen'),
  regiao: z.string().max(50).optional().nullable(),
  video: z.string().url('URL inválida').optional().nullable().or(z.literal('')),
})

export type BannerInput = z.infer<typeof BannerSchema>
