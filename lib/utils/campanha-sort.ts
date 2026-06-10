export const CAMPANHA_SORT_KEYS = [
  'produtos:desc',
  'produtos:asc',
  'updated_at:desc',
  'inicio:asc',
  'inicio:desc',
  'fim:asc',
  'fim:desc',
  'nome:asc',
  'nome:desc',
] as const

export type CampanhaSortKey = (typeof CAMPANHA_SORT_KEYS)[number]

export const DEFAULT_SORT: CampanhaSortKey = 'produtos:desc'

type SortColumn = 'produtos' | 'updated_at' | 'inicio' | 'fim' | 'nome'

type SupabaseColumn =
  | 'qtd_produtos'
  | 'updated_at'
  | 'dta_vigencia_inicio'
  | 'dta_vigencia_fim'
  | 'nom_campanha'

interface ParsedSort {
  column: SortColumn
  supabaseColumn: SupabaseColumn
  ascending: boolean
}

const COLUMN_TO_SUPABASE: Record<SortColumn, SupabaseColumn> = {
  produtos: 'qtd_produtos',
  updated_at: 'updated_at',
  inicio: 'dta_vigencia_inicio',
  fim: 'dta_vigencia_fim',
  nome: 'nom_campanha',
}

export function parseCampanhaSort(value: string | undefined): ParsedSort {
  if (!value) {
    return { column: 'produtos', supabaseColumn: 'qtd_produtos', ascending: false }
  }
  const [col, dir] = value.split(':')
  const allowed = new Set<SortColumn>(['produtos', 'updated_at', 'inicio', 'fim', 'nome'])
  if (!col || !allowed.has(col as SortColumn)) {
    return { column: 'produtos', supabaseColumn: 'qtd_produtos', ascending: false }
  }
  const column = col as SortColumn
  return {
    column,
    supabaseColumn: COLUMN_TO_SUPABASE[column],
    ascending: dir !== 'desc',
  }
}

interface SortOption {
  value: CampanhaSortKey
  labelKey: keyof Sort
}

type Sort = {
  produtosDesc: string
  produtosAsc: string
  updatedDesc: string
  inicioAsc: string
  inicioDesc: string
  fimAsc: string
  fimDesc: string
  nomeAsc: string
  nomeDesc: string
}

export const CAMPANHA_SORT_OPTIONS: SortOption[] = [
  { value: 'produtos:desc', labelKey: 'produtosDesc' },
  { value: 'produtos:asc', labelKey: 'produtosAsc' },
  { value: 'updated_at:desc', labelKey: 'updatedDesc' },
  { value: 'inicio:asc', labelKey: 'inicioAsc' },
  { value: 'inicio:desc', labelKey: 'inicioDesc' },
  { value: 'fim:asc', labelKey: 'fimAsc' },
  { value: 'fim:desc', labelKey: 'fimDesc' },
  { value: 'nome:asc', labelKey: 'nomeAsc' },
  { value: 'nome:desc', labelKey: 'nomeDesc' },
]
