import { z } from 'zod'

const COD_REGEX = /^[a-zA-Z0-9_-]+$/

export const CampanhaSchema = z
  .object({
    cod_campanha: z
      .string()
      .min(3, 'Código deve ter no mínimo 3 caracteres')
      .max(20, 'Código deve ter no máximo 20 caracteres')
      .regex(COD_REGEX, 'Apenas letras, números, hífen e underscore'),
    nom_campanha: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome muito longo'),
    dta_vigencia_inicio: z.string().min(1, 'Data de início é obrigatória'),
    dta_vigencia_fim: z.string().min(1, 'Data de fim é obrigatória'),
    dsc_tipo_campanha: z.string().min(1, 'Tipo é obrigatório').max(100, 'Tipo muito longo'),
    dsc_situacao: z.enum(['Ativa', 'Inativa']).default('Ativa'),
  })
  .refine((data) => new Date(data.dta_vigencia_inicio) <= new Date(data.dta_vigencia_fim), {
    message: 'Início deve ser anterior ou igual ao fim',
    path: ['dta_vigencia_fim'],
  })

export type CampanhaInput = z.infer<typeof CampanhaSchema>

// Update is the same shape but coming from edit dialog (any field can change).
// We keep it as a discrete schema for clarity; dropping cod_campanha because
// it's the natural key and we don't allow changing it.
export const CampanhaUpdateSchema = z
  .object({
    nom_campanha: z.string().min(1).max(200),
    dta_vigencia_inicio: z.string().min(1),
    dta_vigencia_fim: z.string().min(1),
    dsc_tipo_campanha: z.string().min(1).max(100),
    dsc_situacao: z.enum(['Ativa', 'Inativa']),
  })
  .refine((data) => new Date(data.dta_vigencia_inicio) <= new Date(data.dta_vigencia_fim), {
    message: 'Início deve ser anterior ou igual ao fim',
    path: ['dta_vigencia_fim'],
  })

export type CampanhaUpdateInput = z.infer<typeof CampanhaUpdateSchema>
