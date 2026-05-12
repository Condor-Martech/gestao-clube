import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { requireModuleRead } from '@/lib/auth/guards'
import { canWrite as computeCanWrite } from '@/lib/rbac'
import { ProdutosFilters } from './_components/produtos-filters'
import { ProdutosSort } from './_components/produtos-sort'
import { ProdutosTable } from './_components/produtos-table'
import { PaginationControls } from '@/components/shared/pagination-controls'
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  rangeFromPage,
  totalPages,
} from '@/lib/utils/pagination'
import { pickString } from '@/lib/utils/search-params'
import { parseProdutoSort } from '@/lib/utils/produto-sort'
import type { Produto } from '@/types/entities'

interface Props {
  searchParams: Promise<{
    search?: string | string[]
    approved?: string | string[]
    sort?: string | string[]
    page?: string | string[]
  }>
}

export default async function ProdutosPage({ searchParams }: Props) {
  const { isAdmin, moduleRoles } = await requireModuleRead('ofertas')
  const write = computeCanWrite(isAdmin, 'ofertas', moduleRoles)
  const sp = await searchParams
  const t = await getTranslations('produtos')

  const search = pickString(sp.search)
  const approved = pickString(sp.approved)
  const sort = parseProdutoSort(pickString(sp.sort))
  const page = parsePage(pickString(sp.page))
  const range = rangeFromPage({ page, pageSize: DEFAULT_PAGE_SIZE })

  const supabase = await createClient()
  let query = supabase
    .from('produtos_pai')
    .select('*', { count: 'exact' })
    .order(sort.column, { ascending: sort.ascending, nullsFirst: false })
    .range(range.from, range.to)

  if (search) {
    query = query.or(
      `nome.ilike.%${search}%,ean.ilike.%${search}%,departamento.ilike.%${search}%,setor.ilike.%${search}%`,
    )
  }
  if (approved === 'yes') query = query.eq('aproved', true)
  if (approved === 'no') query = query.eq('aproved', false)

  const { data, count, error } = await query
  const produtos = (data ?? []) as unknown as Produto[]
  const total = count ?? 0
  const pages = totalPages(total, DEFAULT_PAGE_SIZE)

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[260px]">
          <ProdutosFilters />
        </div>
        <ProdutosSort />
      </div>

      {error ? (
        <div className="text-destructive border-border rounded-lg border p-6 text-center">
          {error.message}
        </div>
      ) : (
        <ProdutosTable produtos={produtos} canWrite={write} />
      )}

      {total > DEFAULT_PAGE_SIZE && (
        <PaginationControls page={page} totalPages={pages} />
      )}
    </div>
  )
}
