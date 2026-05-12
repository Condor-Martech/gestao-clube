import type {
  Pipeline,
  PipelineNode,
  PipelineNodeData,
  Produto,
} from '@/types/entities'

export interface PipelineContext {
  campanhas: ReadonlyArray<{ cod: string; nome: string | null }>
  eanToCampanhas: Readonly<Record<string, ReadonlyArray<string>>>
}

const EMPTY_CONTEXT: PipelineContext = { campanhas: [], eanToCampanhas: {} }

export class PipelineRunnerError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'NO_SOURCE'
      | 'MULTIPLE_SOURCES'
      | 'NO_APPLY_TERMINAL'
      | 'NON_LINEAR'
      | 'DANGLING_EDGE'
      | 'CYCLE',
  ) {
    super(message)
    this.name = 'PipelineRunnerError'
  }
}

export function runPipeline(
  pipeline: Pipeline,
  produtos: readonly Produto[],
  context: PipelineContext = EMPTY_CONTEXT,
): Produto[] {
  const ordered = topologicalOrder(pipeline)
  let current: Produto[] = [...produtos]
  for (const node of ordered) {
    current = executeNode(node, current, context)
  }
  return current
}

function topologicalOrder(pipeline: Pipeline): PipelineNode[] {
  const { nodes, edges } = pipeline

  const sources = nodes.filter((n) => n.type === 'source')
  if (sources.length === 0) {
    throw new PipelineRunnerError(
      'Pipeline sem nó source',
      'NO_SOURCE',
    )
  }
  if (sources.length > 1) {
    throw new PipelineRunnerError(
      'Pipeline com múltiplos nós source',
      'MULTIPLE_SOURCES',
    )
  }

  const byId = new Map(nodes.map((n) => [n.id, n]))
  for (const edge of edges) {
    if (!byId.has(edge.source) || !byId.has(edge.target)) {
      throw new PipelineRunnerError(
        `Edge ${edge.id} aponta para nó inexistente`,
        'DANGLING_EDGE',
      )
    }
  }

  const outgoing = new Map<string, string[]>()
  for (const edge of edges) {
    const list = outgoing.get(edge.source) ?? []
    list.push(edge.target)
    outgoing.set(edge.source, list)
  }
  for (const [nodeId, targets] of outgoing) {
    if (targets.length > 1) {
      throw new PipelineRunnerError(
        `Nó ${nodeId} tem múltiplas saídas (apenas cadeia linear é suportada)`,
        'NON_LINEAR',
      )
    }
  }

  const result: PipelineNode[] = []
  const visited = new Set<string>()
  let currentId: string | undefined = sources[0]!.id
  while (currentId) {
    if (visited.has(currentId)) {
      throw new PipelineRunnerError(
        `Ciclo detectado no nó ${currentId}`,
        'CYCLE',
      )
    }
    visited.add(currentId)
    result.push(byId.get(currentId)!)
    currentId = outgoing.get(currentId)?.[0]
  }

  const last = result[result.length - 1]
  if (last?.type !== 'apply') {
    throw new PipelineRunnerError(
      'Pipeline não termina em nó apply',
      'NO_APPLY_TERMINAL',
    )
  }

  return result
}

function executeNode(
  node: PipelineNode,
  input: Produto[],
  context: PipelineContext,
): Produto[] {
  switch (node.type) {
    case 'source':
      return input
    case 'boostCampanha':
      return boostByCampanha(input, node.data, context)
    case 'filterMercadologico':
      return filterByMercadologico(input, node.data)
    case 'sortAuto':
      return sortByField(input, node.data)
    case 'sortManual':
      return sortByManualOrder(input, node.data)
    case 'apply':
      return input
    default: {
      console.warn('[runner] tipo de nó desconhecido (legacy?):', node.type)
      return input
    }
  }
}

function boostByCampanha(
  input: Produto[],
  data: PipelineNodeData,
  context: PipelineContext,
): Produto[] {
  const pattern = data.campanhaPattern?.trim().toLowerCase()
  if (!pattern) return input
  const matchingCodes = new Set(
    context.campanhas
      .filter((c) => (c.nome ?? '').toLowerCase().includes(pattern))
      .map((c) => c.cod),
  )
  if (matchingCodes.size === 0) return input
  const boosted: Produto[] = []
  const rest: Produto[] = []
  for (const p of input) {
    const ean = p.ean
    const associated = ean ? context.eanToCampanhas[ean] : undefined
    const codes = associated ?? (p.campanha ? [p.campanha] : [])
    const isMatch = codes.some((cod) => matchingCodes.has(cod))
    if (isMatch) {
      boosted.push(p)
    } else {
      rest.push(p)
    }
  }
  return [...boosted, ...rest]
}

function filterByMercadologico(
  input: Produto[],
  data: PipelineNodeData,
): Produto[] {
  const departamentos = data.departamentos
  const setores = data.setores
  const hasDept = departamentos && departamentos.length > 0
  const hasSetor = setores && setores.length > 0
  if (!hasDept && !hasSetor) return input

  const deptSet = hasDept ? new Set(departamentos) : null
  const setorSet = hasSetor ? new Set(setores) : null

  return input.filter((p) => {
    if (deptSet && (p.departamento == null || !deptSet.has(p.departamento))) {
      return false
    }
    if (setorSet && (p.setor == null || !setorSet.has(p.setor))) {
      return false
    }
    return true
  })
}

function sortByField(input: Produto[], data: PipelineNodeData): Produto[] {
  const field = data.field ?? 'order'
  const dir = data.dir ?? 'asc'
  const sign = dir === 'desc' ? -1 : 1
  return [...input].sort((a, b) => sign * compareField(a, b, field))
}

function compareField(
  a: Produto,
  b: Produto,
  field: NonNullable<PipelineNodeData['field']>,
): number {
  const av = a[field]
  const bv = b[field]
  if (av == null && bv == null) return 0
  if (av == null) return 1
  if (bv == null) return -1
  if (field === 'order') {
    return (av as number) - (bv as number)
  }
  if (field === 'updated_at') {
    return Date.parse(av as string) - Date.parse(bv as string)
  }
  return String(av).localeCompare(String(bv))
}

function sortByManualOrder(
  input: Produto[],
  data: PipelineNodeData,
): Produto[] {
  const ordered = data.orderedEans
  if (!ordered || ordered.length === 0) return input
  const rank = new Map<string, number>()
  ordered.forEach((ean, i) => rank.set(ean, i))
  const tail: Produto[] = []
  const ranked: Array<{ p: Produto; i: number }> = []
  for (const p of input) {
    const ean = p.ean
    const i = ean ? rank.get(ean) : undefined
    if (i == null) tail.push(p)
    else ranked.push({ p, i })
  }
  ranked.sort((x, y) => x.i - y.i)
  return [...ranked.map((r) => r.p), ...tail]
}
