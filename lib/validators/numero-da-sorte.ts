import { z } from 'zod'

const ALLOWED_IMAGE_MIME = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const PDF_MIME = 'application/pdf'
const MAX_PDF_BYTES = 10 * 1024 * 1024

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)')

const datetimeLocalString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Data e hora inválidas')
  .optional()
  .nullable()
  .or(z.literal(''))

const imageFileSchema = z
  .instanceof(File, { message: 'Imagem é obrigatória' })
  .refine((f) => f.size > 0, 'Arquivo vazio')
  .refine(
    (f) => ALLOWED_IMAGE_MIME.includes(f.type),
    'Apenas PNG, JPG ou WEBP',
  )
  .refine((f) => f.size <= MAX_IMAGE_BYTES, 'Imagem muito grande (máx 5MB)')

const pdfFileSchema = z
  .instanceof(File, { message: 'Regulamento PDF é obrigatório' })
  .refine((f) => f.size > 0, 'Arquivo vazio')
  .refine((f) => f.type === PDF_MIME, 'Apenas PDF')
  .refine((f) => f.size <= MAX_PDF_BYTES, 'PDF muito grande (máx 10MB)')

const dateRefine = (data: { startDate: string; endDate: string }) =>
  new Date(data.startDate) <= new Date(data.endDate)

const dateRefineOptions = {
  message: 'Data fim deve ser maior ou igual à inicial',
  path: ['endDate'],
}

export const NumeroDaSorteCreateSchema = z
  .object({
    titulo: z.string().min(1, 'Título é obrigatório').max(200),
    numeroCampanha: z.coerce
      .number()
      .int()
      .positive('Número de campanha deve ser positivo'),
    startDate: dateString,
    endDate: dateString,
    banner: imageFileSchema,
    bannerSmall: imageFileSchema.optional(),
    regulamento: pdfFileSchema,
    publishAt: datetimeLocalString,
    unpublishAt: datetimeLocalString,
  })
  .refine(dateRefine, dateRefineOptions)

export type NumeroDaSorteCreateInput = z.infer<
  typeof NumeroDaSorteCreateSchema
>

export const NumeroDaSorteUpdateSchema = z
  .object({
    titulo: z.string().min(1, 'Título é obrigatório').max(200),
    numeroCampanha: z.coerce
      .number()
      .int()
      .positive('Número de campanha deve ser positivo'),
    startDate: dateString,
    endDate: dateString,
    banner: imageFileSchema.optional(),
    bannerSmall: imageFileSchema.optional(),
    regulamento: pdfFileSchema.optional(),
    publishAt: datetimeLocalString,
    unpublishAt: datetimeLocalString,
  })
  .refine(dateRefine, dateRefineOptions)

export type NumeroDaSorteUpdateInput = z.infer<
  typeof NumeroDaSorteUpdateSchema
>
