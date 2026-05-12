export const PRODUTO_SORT_KEYS = [
  'order:asc',
  'order:desc',
  'nome:asc',
  'nome:desc',
  'ean:asc',
  'updated_at:desc',
  'aproved:desc',
  'aproved:asc',
] as const

export type ProdutoSortKey = (typeof PRODUTO_SORT_KEYS)[number]

export const DEFAULT_SORT: ProdutoSortKey = 'order:asc'

interface ParsedSort {
  column: 'order' | 'nome' | 'ean' | 'updated_at' | 'aproved'
  ascending: boolean
}

export function parseProdutoSort(value: string | undefined): ParsedSort {
  if (!value) return { column: 'order', ascending: true }
  const [col, dir] = value.split(':')
  const allowed = new Set(['order', 'nome', 'ean', 'updated_at', 'aproved'])
  if (!col || !allowed.has(col)) {
    return { column: 'order', ascending: true }
  }
  return {
    column: col as ParsedSort['column'],
    ascending: dir !== 'desc',
  }
}

interface SortOption {
  value: ProdutoSortKey
  labelKey: keyof Sort
}

type Sort = {
  orderAsc: string
  orderDesc: string
  nomeAsc: string
  nomeDesc: string
  eanAsc: string
  updatedDesc: string
  aprovedDesc: string
  aprovedAsc: string
}

export const PRODUTO_SORT_OPTIONS: SortOption[] = [
  { value: 'order:asc', labelKey: 'orderAsc' },
  { value: 'order:desc', labelKey: 'orderDesc' },
  { value: 'nome:asc', labelKey: 'nomeAsc' },
  { value: 'nome:desc', labelKey: 'nomeDesc' },
  { value: 'ean:asc', labelKey: 'eanAsc' },
  { value: 'updated_at:desc', labelKey: 'updatedDesc' },
  { value: 'aproved:desc', labelKey: 'aprovedDesc' },
  { value: 'aproved:asc', labelKey: 'aprovedAsc' },
]
