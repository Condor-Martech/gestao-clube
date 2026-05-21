import { z } from 'zod'

export const BANNER_SUPER_APP_POSITIONS = [
  'block-1',
  'block-2',
  'block-3',
  'block-4',
  'block-5',
] as const

export type BannerSuperAppPosition = (typeof BANNER_SUPER_APP_POSITIONS)[number]

const ALLOWED_IMAGE_MIME = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const imageFileSchema = z
  .instanceof(File, { message: 'Imagem é obrigatória' })
  .refine((f) => f.size > 0, 'Arquivo vazio')
  .refine((f) => ALLOWED_IMAGE_MIME.includes(f.type), 'Apenas PNG, JPG ou WEBP')
  .refine((f) => f.size <= MAX_IMAGE_BYTES, 'Imagem muito grande (máx 5MB)')

const urlField = z.string().url('URL inválida').optional().nullable().or(z.literal(''))

const datetimeLocalString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Data e hora inválidas')
  .optional()
  .nullable()
  .or(z.literal(''))

export const BannerSuperAppCreateSchema = z.object({
  name: z.string().max(200).optional().nullable(),
  url: urlField,
  position: z.enum(BANNER_SUPER_APP_POSITIONS),
  image: imageFileSchema,
  order: z.coerce.number().int().min(0).default(0),
  publishAt: datetimeLocalString,
  unpublishAt: datetimeLocalString,
})

export type BannerSuperAppCreateInput = z.infer<typeof BannerSuperAppCreateSchema>

export const BannerSuperAppUpdateSchema = z.object({
  name: z.string().max(200).optional().nullable(),
  url: urlField,
  position: z.enum(BANNER_SUPER_APP_POSITIONS),
  image: imageFileSchema.optional(),
  order: z.coerce.number().int().min(0).default(0),
  publishAt: datetimeLocalString,
  unpublishAt: datetimeLocalString,
})

export type BannerSuperAppUpdateInput = z.infer<typeof BannerSuperAppUpdateSchema>
