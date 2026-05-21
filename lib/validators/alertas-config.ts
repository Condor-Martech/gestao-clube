import { z } from 'zod'

/** Grupo de WhatsApp destinatário do resumo (JID xxxxx@g.us ou número). */
const GrupoSchema = z.object({
  jid: z
    .string()
    .trim()
    .min(1, 'JID/número é obrigatório')
    .max(120, 'JID muito longo'),
  label: z
    .string()
    .trim()
    .min(1, 'Dê um nome ao grupo')
    .max(80, 'Nome muito longo'),
})

export const AlertasConfigSchema = z.object({
  keywords: z
    .array(z.string().trim().min(1, 'Palavra vazia').max(40, 'Palavra muito longa'))
    .max(100, 'Máximo de 100 palavras-chave'),
  grupos: z.array(GrupoSchema).max(20, 'Máximo de 20 grupos'),
  horasResumo: z
    .array(z.number().int().min(0).max(23))
    .max(24, 'Horas inválidas'),
  ativo: z.boolean(),
})

export type AlertasConfigInput = z.infer<typeof AlertasConfigSchema>
