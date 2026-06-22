import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { requireModuleRead } from '@/lib/auth/guards'
import { canWrite as computeCanWrite } from '@/lib/rbac'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProdutosInfiniteList } from '../_components/produtos-infinite-list'
import { ProdutosFilters } from '../_components/produtos-filters'
import { ProdutosSort } from '../_components/produtos-sort'
import { ProdutosViewToggle, type ProdutoView } from '../_components/produtos-view-toggle'
import { SyncAppDialog } from '../_components/sync-app-dialog'
import { formatDate, formatDateTime } from '@/lib/utils/format'
import { DEFAULT_PAGE_SIZE } from '@/lib/utils/pagination'
import { pickString } from '@/lib/utils/search-params'
import { parseProdutoSort } from '@/lib/utils/produto-sort'
import type { Campanha } from '@/types/entities'

interface Props {
  params: Promise<{ code: string }>
  searchParams: Promise<{
    view?: string | string[]
    search?: string | string[]
    approved?: string | string[]
    sort?: string | string[]
  }>
}

function parseView(value: string | undefined): ProdutoView {
  return value === 'grid' ? 'grid' : 'list'
}

export default async function ProdutosCampanhaPage({ params, searchParams }: Props) {
  const { isAdmin, moduleRoles } = await requireModuleRead('ofertas')
  const write = computeCanWrite(isAdmin, 'ofertas', moduleRoles)
  const { code } = await params
  const sp = await searchParams
  const t = await getTranslations('produtos')

  const view = parseView(pickString(sp.view))
  const search = pickString(sp.search)
  const approved = pickString(sp.approved)
  const sort = parseProdutoSort(pickString(sp.sort))
  const pageSize = view === 'grid' ? 24 : DEFAULT_PAGE_SIZE

  const supabase = await createClient()

  const { data: campanhaRaw } = await supabase
    .from('campanhas')
    .select('*')
    .eq('cod_campanha', code)
    .maybeSingle()

  if (!campanhaRaw) notFound()
  const campanha = campanhaRaw as unknown as Campanha

  // Count only — the list itself is fetched client-side (infinite scroll).
  let countQuery = supabase
    .from('produtos_pai')
    .select('*', { count: 'exact', head: true })
    .eq('campanha', code)

  if (search) {
    countQuery = countQuery.or(
      `nome.ilike.%${search}%,ean.ilike.%${search}%,departamento.ilike.%${search}%,setor.ilike.%${search}%`,
    )
  }
  if (approved === 'yes') countQuery = countQuery.eq('aproved', true)
  if (approved === 'no') countQuery = countQuery.eq('aproved', false)

  const { count } = await countQuery

  const { data: lastSync } = await supabase
    .from('sync_app_with_email')
    .select('created_at, email')
    .eq('campanha', code)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const total = count ?? 0

  // EANs that actually head an agrupamento in this campanha. Same source the
  // /agrupamentos/[code] page uses, so a "pai" is flagged only when it really
  // heads a group — not just because produtos_pai already filters pai = ean.
  const { data: agrupamentoRows } = await supabase
    .from('produtos_no_agrupamento')
    .select('ean')
    .eq('campanha', code)

  const agrupamentoEans = new Set(
    (agrupamentoRows ?? [])
      .map((r) => (r as { ean: string | null }).ean)
      .filter((e): e is string => !!e),
  )

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/campanhas">
          <ChevronLeft className="size-4" />
          {t('title')}
        </Link>
      </Button>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t('campanhaTitle', { code })}
            </h1>
            {campanha.dsc_situacao && (
              <Badge variant={campanha.dsc_situacao === 'Ativa' ? 'success' : 'secondary'}>
                {campanha.dsc_situacao}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            {campanha.nom_campanha}
            {campanha.dta_vigencia_inicio && campanha.dta_vigencia_fim && (
              <>
                {' · '}
                {formatDate(campanha.dta_vigencia_inicio)} — {formatDate(campanha.dta_vigencia_fim)}
              </>
            )}
            {' · '}
            {total} {total === 1 ? 'produto' : 'produtos'}
          </p>
          {lastSync?.created_at && (
            <p className="text-muted-foreground text-xs">
              {t('syncApp.lastUpdate')}: {formatDateTime(lastSync.created_at)}
              {lastSync.email && <> · {lastSync.email}</>}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {write && <SyncAppDialog code={code} />}
          <ProdutosViewToggle value={view} />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[260px] flex-1">
          <ProdutosFilters />
        </div>
        <ProdutosSort />
      </div>

      <ProdutosInfiniteList
        campanhaCode={code}
        view={view}
        pageSize={pageSize}
        search={search}
        approved={approved}
        sortColumn={sort.column}
        sortAscending={sort.ascending}
        canWrite={write}
        agrupamentoEans={Array.from(agrupamentoEans)}
      />
    </div>
  )
}
