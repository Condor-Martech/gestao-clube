import { z } from 'zod'

const EAN_REGEX = /^\d{8,14}$/

export const ProdutoUpdateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(200),
  descricao: z.string().max(1000).optional().nullable(),
  ean: z.string().regex(EAN_REGEX, 'EAN deve ter entre 8 e 14 dígitos').optional().nullable(),
  unidade: z.string().min(1, 'Unidade é obrigatória').max(10, 'Unidade muito longa'),
  order: z.coerce.number().int().min(0).default(0),
  eletro: z.boolean().default(false),
})

export type ProdutoUpdateInput = z.infer<typeof ProdutoUpdateSchema>

export const ProdutoApproveSchema = z.object({
  id: z.string().uuid(),
  approve: z.boolean(),
})

export type ProdutoApproveInput = z.infer<typeof ProdutoApproveSchema>

export const PRODUTO_UNIDADES = ['UN', 'KG', 'LT', 'CX', 'PCT', 'DZ'] as const

/**
 * Partial schema for inline cell edits. Each call updates exactly one field.
 * Refuses empty strings on required fields (nome, unidade) to prevent
 * accidental wipes, but lets descricao be cleared via empty string.
 */
export const ProdutoPartialUpdateSchema = z
  .object({
    nome: z.string().min(1, 'Nome é obrigatório').max(200).optional(),
    descricao: z.string().max(1000).nullable().optional(),
    unidade: z.string().min(1, 'Unidade é obrigatória').max(10).optional(),
    order: z.coerce.number().int().min(0).optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: 'Nenhum campo para atualizar' })

export type ProdutoPartialUpdateInput = z.infer<typeof ProdutoPartialUpdateSchema>
