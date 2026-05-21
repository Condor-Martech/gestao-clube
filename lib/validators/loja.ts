import { z } from 'zod'

export const LojaPartialUpdateSchema = z
  .object({
    title: z.string().min(1, 'Nome é obrigatório').max(200).optional(),
    regiao: z.string().max(100).nullable().optional(),
    cidade: z.string().max(120).nullable().optional(),
    telefone: z.string().max(40).nullable().optional(),
    codLoja: z.string().max(40).nullable().optional(),
    status: z.boolean().optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'Nenhum campo para atualizar',
  })

export type LojaPartialUpdateInput = z.infer<typeof LojaPartialUpdateSchema>

const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v)

export const LojaCreateSchema = z.object({
  title: z.string().min(1, 'Nome é obrigatório').max(200),
  regiao: z.preprocess(emptyToNull, z.string().max(100).nullable()).default(null),
  cidade: z.preprocess(emptyToNull, z.string().max(120).nullable()).default(null),
  telefone: z.preprocess(emptyToNull, z.string().max(40).nullable()).default(null),
  codLoja: z.preprocess(emptyToNull, z.string().max(40).nullable()).default(null),
  status: z.boolean().default(true),
})

export type LojaCreateInput = z.infer<typeof LojaCreateSchema>
