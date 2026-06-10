import { PermissionGate } from '@/components/rbac/permission-gate'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { requireModuleRead } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { parseCampanhaSort } from '@/lib/utils/campanha-sort'
import { statusVariant } from '@/lib/utils/campanha-status'
import { formatDate, formatDateTime } from '@/lib/utils/format'
import { DEFAULT_PAGE_SIZE, parsePage, rangeFromPage, totalPages } from '@/lib/utils/pagination'
import { pickString } from '@/lib/utils/search-params'
import type { Campanha } from '@/types/entities'
import { Megaphone } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { CampanhaInlineActions } from './_components/campanha-inline-actions'
import { CampanhasFilters } from './_components/campanhas-filters'
import { CampanhasSearch } from './_components/campanhas-search'
import { CampanhasSort } from './_components/campanhas-sort'
import { StatusTabs, type ProductFilter } from './_components/status-tabs'
import { SyncCampanhaDialog } from './_components/sync-campanha-dialog'

interface Props {
  searchParams: Promise<{
    hasProducts?: string | string[]
    search?: string | string[]
    page?: string | string[]
    sort?: string | string[]
    tipo?: string | string[]
    situacao?: string | string[]
    vigencia_from?: string | string[]
    vigencia_to?: string | string[]
  }>
}

export default async function CampanhasPage({ searchParams }: Props) {
  const { isAdmin, moduleRoles } = await requireModuleRead('ofertas')
  const sp = await searchParams
  const t = await getTranslations('campanhas')
  const tc = await getTranslations('common')

  const rawFilter = pickString(sp.hasProducts)
  const filter: ProductFilter =
    rawFilter === 'without' || rawFilter === 'approved' ? rawFilter : 'with'
  const search = pickString(sp.search)
  const tipo = pickString(sp.tipo)
  const situacao = pickString(sp.situacao)
  const vigenciaFrom = pickString(sp.vigencia_from)
  const vigenciaTo = pickString(sp.vigencia_to)
  const sort = parseCampanhaSort(pickString(sp.sort))
  const page = parsePage(pickString(sp.page))
  const range = rangeFromPage({ page, pageSize: DEFAULT_PAGE_SIZE })

  const supabase = await createClient()

  const [tipoDistinctRes, situacaoDistinctRes] = await Promise.all([
    supabase
      .from('campanhas')
      .select('dsc_tipo_campanha')
      .not('dsc_tipo_campanha', 'is', null)
      .order('dsc_tipo_campanha', { ascending: true })
      .limit(500),
    supabase
      .from('campanhas')
      .select('dsc_situacao')
      .not('dsc_situacao', 'is', null)
      .order('dsc_situacao', { ascending: true })
      .limit(500),
  ])

  const tipoOptions = Array.from(
    new Set(
      (tipoDistinctRes.data ?? [])
        .map((r) => (r as { dsc_tipo_campanha: string | null }).dsc_tipo_campanha)
        .filter((v): v is string => !!v && v.trim() !== ''),
    ),
  )
  const situacaoOptions = Array.from(
    new Set(
      (situacaoDistinctRes.data ?? [])
        .map((r) => (r as { dsc_situacao: string | null }).dsc_situacao)
        .filter((v): v is string => !!v && v.trim() !== ''),
    ),
  )

  let query = supabase
    .from('campanhas')
    .select('*', { count: 'exact' })
    .order(sort.supabaseColumn, { ascending: sort.ascending, nullsFirst: false })
    .range(range.from, range.to)

  if (filter === 'with') {
    query = query.gt('qtd_produtos', 0).or('dsc_situacao.is.null,dsc_situacao.not.ilike.aprovada')
  } else if (filter === 'without') {
    query = query
      .or('qtd_produtos.is.null,qtd_produtos.eq.0')
      .or('dsc_situacao.is.null,dsc_situacao.not.ilike.aprovada')
  } else {
    query = query.ilike('dsc_situacao', 'aprovada')
  }

  if (search) {
    query = query.or(`cod_campanha.ilike.%${search}%,nom_campanha.ilike.%${search}%`)
  }

  if (tipo) {
    query = query.eq('dsc_tipo_campanha', tipo)
  }

  if (situacao) {
    query = query.eq('dsc_situacao', situacao)
  }

  if (vigenciaFrom) {
    query = query.gte('dta_vigencia_inicio', vigenciaFrom)
  }

  if (vigenciaTo) {
    query = query.lte('dta_vigencia_fim', vigenciaTo)
  }

  const { data, count, error } = await query
  const campanhas = (data ?? []) as unknown as Campanha[]
  const total = count ?? 0
  const pages = totalPages(total, DEFAULT_PAGE_SIZE)

  return (
    <div className="space-y-4">
      <header className="border-border bg-card flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
        <h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
        <PermissionGate isAdmin={isAdmin} moduleRoles={moduleRoles} module="ofertas">
          <SyncCampanhaDialog
            trigger={
              <Button>
                <Megaphone className="size-4" />
                {t('addButton')}
              </Button>
            }
          />
        </PermissionGate>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <CampanhasFilters tipoOptions={tipoOptions} situacaoOptions={situacaoOptions} />
        <div className="flex flex-wrap items-center gap-2">
          <CampanhasSort />
          <CampanhasSearch />
        </div>
      </div>

      <StatusTabs value={filter} />

      <div className="border-border overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[60px]">{t('columns.cod')}</TableHead>
              <TableHead className="w-[360px]">{t('columns.nom')}</TableHead>
              <TableHead className="w-[110px]">{t('columns.inicio')}</TableHead>
              <TableHead className="w-[110px]">{t('columns.fim')}</TableHead>
              <TableHead className="w-[60px] text-left">{t('columns.produtos')}</TableHead>
              <TableHead className="w-[160px]">{t('columns.situacao')}</TableHead>
              <TableHead className="hidden w-[140px] lg:table-cell">{t('columns.tipo')}</TableHead>
              <TableHead className="w-[70px] text-left">{t('columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={8} className="text-destructive py-8 text-center">
                  {error.message}
                </TableCell>
              </TableRow>
            ) : campanhas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                  {tc('noResults')}
                </TableCell>
              </TableRow>
            ) : (
              campanhas.map((c) => (
                <TableRow key={c.cod_campanha}>
                  <TableCell className="font-mono text-xs font-medium">{c.cod_campanha}</TableCell>
                  <TableCell className="w-[280px] max-w-[280px]">
                    <div className="flex flex-col leading-tight">
                      <span className="truncate text-xs font-medium">{c.nom_campanha ?? '—'}</span>
                      {c.updated_at && (
                        <span className="text-muted-foreground text-[11px]">
                          {t('updatedAt', { at: formatDateTime(c.updated_at) })}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {c.dta_vigencia_inicio ? formatDate(c.dta_vigencia_inicio) : '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {c.dta_vigencia_fim ? formatDate(c.dta_vigencia_fim) : '—'}
                  </TableCell>
                  <TableCell className="text-right text-base font-bold">
                    {c.qtd_produtos ?? 0}
                  </TableCell>
                  <TableCell>
                    {c.dsc_situacao && (
                      <Badge variant={statusVariant(c.dsc_situacao)}>{c.dsc_situacao}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-xs lg:table-cell">
                    {c.dsc_tipo_campanha ?? '—'}
                  </TableCell>
                  <TableCell>
                    <CampanhaInlineActions campanha={c} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > DEFAULT_PAGE_SIZE && <PaginationControls page={page} totalPages={pages} />}
    </div>
  )
}
