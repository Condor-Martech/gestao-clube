import { z } from 'zod'

export const AgrupamentoSchema = z.object({
  grupo: z
    .string()
    .min(1, 'Nome do grupo é obrigatório')
    .max(100, 'Nome muito longo'),
  ean: z.string().min(1, 'EAN é obrigatório'),
  host: z.string().optional().nullable(),
  order: z.coerce.number().int().min(0).default(0),
  campanha: z.string().min(1, 'Campanha é obrigatória'),
})

export type AgrupamentoInput = z.infer<typeof AgrupamentoSchema>
