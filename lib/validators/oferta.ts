import { z } from 'zod'

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/
const YOUTUBE_REGEX = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]+/

export const OfertaCarrosselSchema = z.object({
  cor: z.string().regex(HEX_REGEX, 'Cor deve ser hex #RRGGBB'),
  titulo: z.string().min(1, 'Título é obrigatório').max(120, 'Título muito longo'),
  images: z
    .array(z.string().url('URL inválida'))
    .min(1, 'Adicione ao menos 1 imagem')
    .max(20, 'Máximo 20 imagens'),
})

export const OfertaUpdateSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200),
  video: z
    .string()
    .regex(YOUTUBE_REGEX, 'URL do YouTube inválida')
    .or(z.literal(''))
    .nullable()
    .transform((v) => v || null),
  carrosel: OfertaCarrosselSchema,
  carrosel2: OfertaCarrosselSchema,
  carrosel3: OfertaCarrosselSchema,
})

export type OfertaCarrosselInput = z.infer<typeof OfertaCarrosselSchema>
export type OfertaUpdateInput = z.infer<typeof OfertaUpdateSchema>
