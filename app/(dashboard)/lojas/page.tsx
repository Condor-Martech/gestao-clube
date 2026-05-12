import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { requireModuleRead } from '@/lib/auth/guards'
import { canWrite } from '@/lib/rbac'
import { PermissionGate } from '@/components/rbac/permission-gate'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LojasFilters } from './_components/lojas-filters'
import { LojaDialog } from './_components/loja-dialog'
import {
  EditableTextCell,
  EditableStatusCell,
} from './_components/editable-cells'
import { PaginationControls } from '@/components/shared/pagination-controls'
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  rangeFromPage,
  totalPages,
} from '@/lib/utils/pagination'
import { pickString } from '@/lib/utils/search-params'
import type { Loja } from '@/types/entities'

interface Props {
  searchParams: Promise<{
    search?: string | string[]
    regiao?: string | string[]
    status?: string | string[]
    page?: string | string[]
  }>
}

export default async function LojasPage({ searchParams }: Props) {
  const { isAdmin, moduleRoles } = await requireModuleRead('stores')
  const write = canWrite(isAdmin, 'stores', moduleRoles)
  const sp = await searchParams
  const t = await getTranslations('lojas')
  const tc = await getTranslations('common')

  const search = pickString(sp.search)
  const regiao = pickString(sp.regiao)
  const status = pickString(sp.status)
  const page = parsePage(pickString(sp.page))
  const { from, to } = rangeFromPage({ page, pageSize: DEFAULT_PAGE_SIZE })

  const supabase = await createClient()

  let query = supabase
    .from('Lojas')
    .select('*', { count: 'exact' })
    .order('title', { ascending: true })
    .range(from, to)

  if (search) {
    query = query.or(`title.ilike.%${search}%,cidade.ilike.%${search}%`)
  }
  if (regiao) query = query.eq('regiao', regiao)
  if (status === 'active') query = query.eq('status', true)
  if (status === 'inactive') query = query.eq('status', false)

  const { data, count, error } = await query

  const lojas = (data ?? []) as unknown as Loja[]
  const total = count ?? 0
  const pages = totalPages(total, DEFAULT_PAGE_SIZE)

  // Distinct regions for filter dropdown.
  const { data: regionsData } = await supabase
    .from('Lojas')
    .select('regiao')
    .not('regiao', 'is', null)
  const regions = Array.from(
    new Set(((regionsData ?? []) as { regiao: string | null }[]).map((r) => r.regiao).filter(Boolean) as string[]),
  ).sort()

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        </div>
        <PermissionGate isAdmin={isAdmin} moduleRoles={moduleRoles} module="stores">
          <LojaDialog />
        </PermissionGate>
      </header>

      <LojasFilters regions={regions} />

      <div className="border-border rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('columns.title')}</TableHead>
              <TableHead>{t('columns.regiao')}</TableHead>
              <TableHead>{t('columns.cidade')}</TableHead>
              <TableHead>{t('columns.telefone')}</TableHead>
              <TableHead>{t('columns.codLoja')}</TableHead>
              <TableHead>{t('columns.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-destructive py-8 text-center">
                  {error.message}
                </TableCell>
              </TableRow>
            ) : lojas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                  {tc('noResults')}
                </TableCell>
              </TableRow>
            ) : (
              lojas.map((loja) => (
                <TableRow key={loja.id}>
                  <TableCell className="font-medium">
                    <EditableTextCell
                      lojaId={loja.id}
                      field="title"
                      initialValue={loja.title}
                      canWrite={write}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableTextCell
                      lojaId={loja.id}
                      field="regiao"
                      initialValue={loja.regiao}
                      canWrite={write}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableTextCell
                      lojaId={loja.id}
                      field="cidade"
                      initialValue={loja.cidade}
                      canWrite={write}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableTextCell
                      lojaId={loja.id}
                      field="telefone"
                      initialValue={loja.telefone}
                      canWrite={write}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableTextCell
                      lojaId={loja.id}
                      field="codLoja"
                      initialValue={loja.codLoja}
                      canWrite={write}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableStatusCell
                      lojaId={loja.id}
                      initialValue={loja.status}
                      canWrite={write}
                    />
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
