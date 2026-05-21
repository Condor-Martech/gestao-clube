import { describe, expect, it } from 'vitest'
import type { Pipeline, PipelineEdge, PipelineNode, Produto } from '@/types/entities'
import { PipelineRunnerError, runPipeline, type PipelineContext } from './runner'

const EMPTY_CTX: PipelineContext = { campanhas: [], eanToCampanhas: {} }

function makeProduto(overrides: Partial<Produto> = {}): Produto {
  return {
    id: overrides.ean ?? overrides.id ?? 'id',
    ean: null,
    nome: null,
    descricao: null,
    unidade: null,
    img_internal: null,
    img_external: null,
    host: null,
    order: null,
    campanha: null,
    aproved: null,
    aproved_user: null,
    aproved_at: null,
    pai: null,
    eletro: null,
    departamento: null,
    departamento_cod: null,
    setor: null,
    setor_cod: null,
    created_at: null,
    updated_at: null,
    ...overrides,
  }
}

function makePipeline(nodes: PipelineNode[], edges: PipelineEdge[]): Pipeline {
  return {
    id: 'pipe-1',
    name: 'Test',
    owner_id: 'owner',
    nodes,
    edges,
    created_at: '',
    updated_at: '',
  }
}

const POS = { x: 0, y: 0 }

function chain(...nodes: PipelineNode[]): PipelineEdge[] {
  return nodes.slice(0, -1).map((node, i) => ({
    id: `e-${i}`,
    source: node.id,
    target: nodes[i + 1]!.id,
  }))
}

const source: PipelineNode = { id: 's', type: 'source', position: POS, data: {} }
const apply: PipelineNode = { id: 'a', type: 'apply', position: POS, data: {} }

describe('runPipeline — filtros', () => {
  it('boostCampanha sem pattern devolve input intacto', () => {
    const node: PipelineNode = {
      id: 'bc',
      type: 'boostCampanha',
      position: POS,
      data: {},
    }
    const produtos = [
      makeProduto({ ean: '1', campanha: 'A' }),
      makeProduto({ ean: '2', campanha: 'B' }),
    ]
    const result = runPipeline(
      makePipeline([source, node, apply], chain(source, node, apply)),
      produtos,
      EMPTY_CTX,
    )
    expect(result.map((p) => p.ean)).toEqual(['1', '2'])
  })

  it('boostCampanha matched arriba, rest abajo, preservando orden interno', () => {
    const node: PipelineNode = {
      id: 'bc',
      type: 'boostCampanha',
      position: POS,
      data: { campanhaPattern: 'bom dia' },
    }
    const ctx: PipelineContext = {
      campanhas: [
        { cod: 'C1', nome: 'BOM DIA ECONOMIA - MAIO' },
        { cod: 'C2', nome: 'Bom Dia Economia - Junho' },
        { cod: 'C3', nome: 'BLACK FRIDAY' },
      ],
      eanToCampanhas: {
        '1': ['C3'],
        '2': ['C1'],
        '3': ['C3'],
        '4': ['C2'],
      },
    }
    const produtos = [
      makeProduto({ ean: '1', campanha: 'C3' }),
      makeProduto({ ean: '2', campanha: 'C1' }),
      makeProduto({ ean: '3', campanha: 'C3' }),
      makeProduto({ ean: '4', campanha: 'C2' }),
      makeProduto({ ean: '5', campanha: null }),
    ]
    const result = runPipeline(
      makePipeline([source, node, apply], chain(source, node, apply)),
      produtos,
      ctx,
    )
    expect(result.map((p) => p.ean)).toEqual(['2', '4', '1', '3', '5'])
  })

  it('boostCampanha matchea por QUALQUER campanha associada ao EAN', () => {
    const node: PipelineNode = {
      id: 'bc',
      type: 'boostCampanha',
      position: POS,
      data: { campanhaPattern: 'bom dia' },
    }
    const ctx: PipelineContext = {
      campanhas: [
        { cod: 'BOM_DIA', nome: 'BOM DIA ECONOMIA' },
        { cod: 'OUTRA', nome: 'OUTRA CAMPANHA' },
      ],
      eanToCampanhas: {
        // EAN 1 está em OUTRA E em BOM_DIA — deve boostear apesar de
        // produto.campanha apontar a OUTRA
        '1': ['OUTRA', 'BOM_DIA'],
        // EAN 2 só em OUTRA — não boost
        '2': ['OUTRA'],
      },
    }
    const produtos = [
      makeProduto({ ean: '1', campanha: 'OUTRA' }),
      makeProduto({ ean: '2', campanha: 'OUTRA' }),
    ]
    const result = runPipeline(
      makePipeline([source, node, apply], chain(source, node, apply)),
      produtos,
      ctx,
    )
    expect(result.map((p) => p.ean)).toEqual(['1', '2'])
  })

  it('boostCampanha sem matches devolve input intacto (não reduz)', () => {
    const node: PipelineNode = {
      id: 'bc',
      type: 'boostCampanha',
      position: POS,
      data: { campanhaPattern: 'natal' },
    }
    const ctx: PipelineContext = {
      campanhas: [{ cod: 'C1', nome: 'BOM DIA ECONOMIA' }],
      eanToCampanhas: { '1': ['C1'], '2': ['C1'] },
    }
    const produtos = [
      makeProduto({ ean: '1', campanha: 'C1' }),
      makeProduto({ ean: '2', campanha: 'C1' }),
    ]
    const result = runPipeline(
      makePipeline([source, node, apply], chain(source, node, apply)),
      produtos,
      ctx,
    )
    expect(result.map((p) => p.ean)).toEqual(['1', '2'])
  })

  it('boostCampanha pattern só com espaços é tratado como vazio', () => {
    const node: PipelineNode = {
      id: 'bc',
      type: 'boostCampanha',
      position: POS,
      data: { campanhaPattern: '   ' },
    }
    const produtos = [makeProduto({ ean: '1', campanha: 'A' })]
    const result = runPipeline(
      makePipeline([source, node, apply], chain(source, node, apply)),
      produtos,
      EMPTY_CTX,
    )
    expect(result).toHaveLength(1)
  })

  it('filterMercadologico sem valores devolve input completo', () => {
    const node: PipelineNode = {
      id: 'fm',
      type: 'filterMercadologico',
      position: POS,
      data: {},
    }
    const produtos = [makeProduto({ ean: '1', departamento: 'X' })]
    const result = runPipeline(
      makePipeline([source, node, apply], chain(source, node, apply)),
      produtos,
    )
    expect(result).toHaveLength(1)
  })

  it('filterMercadologico aplica AND entre departamento e setor', () => {
    const node: PipelineNode = {
      id: 'fm',
      type: 'filterMercadologico',
      position: POS,
      data: { departamentos: ['MERCEARIA'], setores: ['CAFE'] },
    }
    const produtos = [
      makeProduto({ ean: '1', departamento: 'MERCEARIA', setor: 'CAFE' }),
      makeProduto({ ean: '2', departamento: 'MERCEARIA', setor: 'BISCOITO' }),
      makeProduto({ ean: '3', departamento: 'BEBIDAS', setor: 'CAFE' }),
    ]
    const result = runPipeline(
      makePipeline([source, node, apply], chain(source, node, apply)),
      produtos,
    )
    expect(result.map((p) => p.ean)).toEqual(['1'])
  })
})

describe('runPipeline — ordenação', () => {
  it('sortAuto por nome asc com defaults', () => {
    const node: PipelineNode = {
      id: 'sa',
      type: 'sortAuto',
      position: POS,
      data: { field: 'nome', dir: 'asc' },
    }
    const produtos = [
      makeProduto({ ean: '1', nome: 'Café' }),
      makeProduto({ ean: '2', nome: 'Açúcar' }),
      makeProduto({ ean: '3', nome: 'Biscoito' }),
    ]
    const result = runPipeline(
      makePipeline([source, node, apply], chain(source, node, apply)),
      produtos,
    )
    expect(result.map((p) => p.ean)).toEqual(['2', '3', '1'])
  })

  it('sortAuto por order desc', () => {
    const node: PipelineNode = {
      id: 'sa',
      type: 'sortAuto',
      position: POS,
      data: { field: 'order', dir: 'desc' },
    }
    const produtos = [
      makeProduto({ ean: '1', order: 5 }),
      makeProduto({ ean: '2', order: 10 }),
      makeProduto({ ean: '3', order: 1 }),
    ]
    const result = runPipeline(
      makePipeline([source, node, apply], chain(source, node, apply)),
      produtos,
    )
    expect(result.map((p) => p.ean)).toEqual(['2', '1', '3'])
  })

  it('sortAuto coloca nulls no final', () => {
    const node: PipelineNode = {
      id: 'sa',
      type: 'sortAuto',
      position: POS,
      data: { field: 'order', dir: 'asc' },
    }
    const produtos = [
      makeProduto({ ean: '1', order: null }),
      makeProduto({ ean: '2', order: 1 }),
      makeProduto({ ean: '3', order: null }),
      makeProduto({ ean: '4', order: 2 }),
    ]
    const result = runPipeline(
      makePipeline([source, node, apply], chain(source, node, apply)),
      produtos,
    )
    expect(result.map((p) => p.ean)).toEqual(['2', '4', '1', '3'])
  })

  it('sortAuto não muta o input', () => {
    const node: PipelineNode = {
      id: 'sa',
      type: 'sortAuto',
      position: POS,
      data: { field: 'nome', dir: 'asc' },
    }
    const produtos = [makeProduto({ ean: '1', nome: 'Z' }), makeProduto({ ean: '2', nome: 'A' })]
    runPipeline(makePipeline([source, node, apply], chain(source, node, apply)), produtos)
    expect(produtos.map((p) => p.ean)).toEqual(['1', '2'])
  })

  it('sortManual reordena pelos EANs informados e manda não-listados ao fim', () => {
    const node: PipelineNode = {
      id: 'sm',
      type: 'sortManual',
      position: POS,
      data: { orderedEans: ['3', '1'] },
    }
    const produtos = [
      makeProduto({ ean: '1' }),
      makeProduto({ ean: '2' }),
      makeProduto({ ean: '3' }),
      makeProduto({ ean: '4' }),
    ]
    const result = runPipeline(
      makePipeline([source, node, apply], chain(source, node, apply)),
      produtos,
    )
    expect(result.map((p) => p.ean)).toEqual(['3', '1', '2', '4'])
  })

  it('sortManual sem orderedEans devolve input', () => {
    const node: PipelineNode = {
      id: 'sm',
      type: 'sortManual',
      position: POS,
      data: {},
    }
    const produtos = [makeProduto({ ean: '1' }), makeProduto({ ean: '2' })]
    const result = runPipeline(
      makePipeline([source, node, apply], chain(source, node, apply)),
      produtos,
    )
    expect(result.map((p) => p.ean)).toEqual(['1', '2'])
  })
})

describe('runPipeline — integração', () => {
  it('cadeia completa: source → sortAuto → boostCampanha → apply', () => {
    const sa: PipelineNode = {
      id: 'sa',
      type: 'sortAuto',
      position: POS,
      data: { field: 'nome', dir: 'asc' },
    }
    const bc: PipelineNode = {
      id: 'bc',
      type: 'boostCampanha',
      position: POS,
      data: { campanhaPattern: 'maio' },
    }
    const nodes = [source, sa, bc, apply]
    const edges = chain(source, sa, bc, apply)
    const ctx: PipelineContext = {
      campanhas: [
        { cod: 'C-MAIO', nome: 'CAMPANHA MAIO 2026' },
        { cod: 'C-JUNHO', nome: 'CAMPANHA JUNHO 2026' },
      ],
      eanToCampanhas: {
        '1': ['C-MAIO'],
        '2': ['C-JUNHO'],
        '3': ['C-MAIO'],
      },
    }
    const produtos = [
      makeProduto({ ean: '1', campanha: 'C-MAIO', nome: 'Z' }),
      makeProduto({ ean: '2', campanha: 'C-JUNHO', nome: 'A' }),
      makeProduto({ ean: '3', campanha: 'C-MAIO', nome: 'A' }),
    ]
    const result = runPipeline(makePipeline(nodes, edges), produtos, ctx)
    expect(result.map((p) => p.ean)).toEqual(['3', '1', '2'])
  })

  it('apply é no-op (não persiste, devolve input intacto)', () => {
    const produtos = [makeProduto({ ean: '1' }), makeProduto({ ean: '2' })]
    const result = runPipeline(makePipeline([source, apply], chain(source, apply)), produtos)
    expect(result.map((p) => p.ean)).toEqual(['1', '2'])
  })
})

describe('runPipeline — erros estruturais', () => {
  it('lança NO_SOURCE quando não há nó source', () => {
    expect(() => runPipeline(makePipeline([apply], []), [])).toThrowError(PipelineRunnerError)
  })

  it('lança MULTIPLE_SOURCES com mais de um source', () => {
    const s2: PipelineNode = { id: 's2', type: 'source', position: POS, data: {} }
    expect(() =>
      runPipeline(makePipeline([source, s2, apply], chain(source, apply)), []),
    ).toThrowError(/MULTIPLE_SOURCES|múltiplos/)
  })

  it('lança NO_APPLY_TERMINAL quando não termina em apply', () => {
    const sa: PipelineNode = {
      id: 'sa',
      type: 'sortAuto',
      position: POS,
      data: {},
    }
    expect(() => runPipeline(makePipeline([source, sa], chain(source, sa)), [])).toThrowError(
      /apply/,
    )
  })

  it('lança NON_LINEAR com nó de saída múltipla', () => {
    const fa: PipelineNode = {
      id: 'fa',
      type: 'sortAuto',
      position: POS,
      data: {},
    }
    const fc: PipelineNode = {
      id: 'fc',
      type: 'boostCampanha',
      position: POS,
      data: {},
    }
    const edges: PipelineEdge[] = [
      { id: 'e1', source: 's', target: 'fa' },
      { id: 'e2', source: 's', target: 'fc' },
      { id: 'e3', source: 'fa', target: 'a' },
    ]
    expect(() => runPipeline(makePipeline([source, fa, fc, apply], edges), [])).toThrowError(
      /cadeia linear/,
    )
  })

  it('lança DANGLING_EDGE quando edge aponta a nó inexistente', () => {
    const edges: PipelineEdge[] = [{ id: 'e1', source: 's', target: 'fantasma' }]
    expect(() => runPipeline(makePipeline([source, apply], edges), [])).toThrowError(/inexistente/)
  })
})
