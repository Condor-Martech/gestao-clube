import { z } from 'zod'

export const AgrupamentoSchema = z.object({
  // Lista de hosts únicos separados por vírgula ([pai.host, ...itens.host]).
  grupo: z.string().min(1, 'Grupo é obrigatório'),
  ean: z.string().min(1, 'EAN é obrigatório'),
  host: z.string().optional().nullable(),
  order: z.coerce.number().int().min(0).optional().nullable(),
  campanha: z.string().min(1, 'Campanha é obrigatória'),
})

export type AgrupamentoInput = z.infer<typeof AgrupamentoSchema>
