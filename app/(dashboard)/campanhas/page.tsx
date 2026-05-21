import { Megaphone } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { requireModuleRead } from '@/lib/auth/guards'
import { PermissionGate } from '@/components/rbac/permission-gate'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { SyncCampanhaDialog } from './_components/sync-campanha-dialog'
import { CampanhaInlineActions } from './_components/campanha-inline-actions'
import { CampanhasSearch } from './_components/campanhas-search'
import { StatusTabs, type ProductFilter } from './_components/status-tabs'
import { Button } from '@/components/ui/button'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { formatDate, formatDateTime } from '@/lib/utils/format'
import { statusVariant } from '@/lib/utils/campanha-status'
import { DEFAULT_PAGE_SIZE, parsePage, rangeFromPage, totalPages } from '@/lib/utils/pagination'
import { pickString } from '@/lib/utils/search-params'
import type { Campanha } from '@/types/entities'

interface Props {
  searchParams: Promise<{
    hasProducts?: string | string[]
    search?: string | string[]
    page?: string | string[]
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
  const page = parsePage(pickString(sp.page))
  const range = rangeFromPage({ page, pageSize: DEFAULT_PAGE_SIZE })

  const supabase = await createClient()

  let query = supabase
    .from('campanhas')
    .select('*', { count: 'exact' })
    .order('qtd_produtos', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false, nullsFirst: false })
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-end">
        <CampanhasSearch />
      </div>

      <StatusTabs value={filter} />

      <div className="border-border overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[110px]">{t('columns.cod')}</TableHead>
              <TableHead className="w-[280px]">{t('columns.nom')}</TableHead>
              <TableHead className="w-[110px]">{t('columns.inicio')}</TableHead>
              <TableHead className="w-[110px]">{t('columns.fim')}</TableHead>
              <TableHead className="w-[80px] text-right">{t('columns.produtos')}</TableHead>
              <TableHead className="w-[120px]">{t('columns.situacao')}</TableHead>
              <TableHead className="hidden w-[180px] lg:table-cell">{t('columns.tipo')}</TableHead>
              <TableHead className="w-[260px] text-right">{t('columns.actions')}</TableHead>
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
