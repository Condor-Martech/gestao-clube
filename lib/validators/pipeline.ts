import { z } from 'zod'

const NodeType = z.enum([
  'source',
  'boostCampanha',
  'filterMercadologico',
  'sortAuto',
  'sortManual',
  'apply',
])

const NodeData = z
  .object({
    campanhaPattern: z.string().max(120).optional(),
    departamentos: z.array(z.string()).optional(),
    setores: z.array(z.string()).optional(),
    field: z.enum(['nome', 'ean', 'updated_at', 'order']).optional(),
    dir: z.enum(['asc', 'desc']).optional(),
    orderedEans: z.array(z.string()).optional(),
  })
  .strict()

const PipelineNodeSchema = z.object({
  id: z.string().min(1),
  type: NodeType,
  position: z.object({ x: z.number(), y: z.number() }),
  data: NodeData,
})

const PipelineEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
})

export const PipelineCreateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(120, 'Nome muito longo'),
})

export const PipelineUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  nodes: z.array(PipelineNodeSchema).optional(),
  edges: z.array(PipelineEdgeSchema).optional(),
})

export const ApplyPipelineOrderSchema = z.object({
  orderedEans: z
    .array(z.string().min(1))
    .min(1, 'Nenhum produto selecionado')
    .max(100000, 'Subset muito grande'),
})

export type PipelineCreateInput = z.infer<typeof PipelineCreateSchema>
export type PipelineUpdateInput = z.infer<typeof PipelineUpdateSchema>
export type ApplyPipelineOrderInput = z.infer<typeof ApplyPipelineOrderSchema>
