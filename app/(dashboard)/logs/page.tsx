import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireModuleRead } from '@/lib/auth/guards'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LogsFilters } from './_components/logs-filters'
import { LogPayloadSheet } from './_components/log-payload-sheet'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { formatDateTime } from '@/lib/utils/format'
import { DEFAULT_PAGE_SIZE, parsePage, rangeFromPage, totalPages } from '@/lib/utils/pagination'
import { pickString } from '@/lib/utils/search-params'
import type { LogEntry } from '@/types/entities'

interface Props {
  searchParams: Promise<{
    q?: string | string[]
    from?: string | string[]
    to?: string | string[]
    module?: string | string[]
    user?: string | string[]
    page?: string | string[]
  }>
}

const LOGS_VIEW = 'logs_with_users'

function escapeIlike(value: string) {
  return value.replace(/[%_]/g, (m) => `\\${m}`)
}

export default async function LogsPage({ searchParams }: Props) {
  await requireModuleRead('operacionais')
  const sp = await searchParams
  const t = await getTranslations('logs')
  const tc = await getTranslations('common')

  const q = pickString(sp.q)
  const from = pickString(sp.from)
  const to = pickString(sp.to)
  const moduleParam = pickString(sp.module)
  const userParam = pickString(sp.user)
  const page = parsePage(pickString(sp.page))
  const range = rangeFromPage({ page, pageSize: DEFAULT_PAGE_SIZE })

  const supabase = await createClient()

  let query = supabase
    .from(LOGS_VIEW)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(range.from, range.to)

  if (from) query = query.gte('created_at', `${from}T00:00:00.000Z`)
  if (to) query = query.lte('created_at', `${to}T23:59:59.999Z`)
  if (moduleParam) query = query.eq('module', moduleParam)
  if (userParam) query = query.eq('email', userParam)
  if (q) {
    const safe = escapeIlike(q)
    query = query.or(`event_name.ilike.%${safe}%,email.ilike.%${safe}%,module.ilike.%${safe}%`)
  }

  const [{ data, count, error }, { data: moduleRows }, { data: userRows }] = await Promise.all([
    query,
    supabase.from(LOGS_VIEW).select('module').not('module', 'is', null).limit(500),
    supabase.from(LOGS_VIEW).select('email').not('email', 'is', null).limit(500),
  ])

  const logs = (data ?? []) as unknown as LogEntry[]
  const total = count ?? 0
  const pages = totalPages(total, DEFAULT_PAGE_SIZE)

  const modules = Array.from(
    new Set(
      (moduleRows ?? [])
        .map((r) => (r as { module: string | null }).module)
        .filter(Boolean) as string[],
    ),
  ).sort()

  const users = Array.from(
    new Set(
      (userRows ?? [])
        .map((r) => (r as { email: string | null }).email)
        .filter(Boolean) as string[],
    ),
  ).sort()

  const exportParams = new URLSearchParams()
  if (q) exportParams.set('q', q)
  if (from) exportParams.set('from', from)
  if (to) exportParams.set('to', to)
  if (moduleParam) exportParams.set('module', moduleParam)
  const exportHref = `/api/logs/export${exportParams.toString() ? `?${exportParams.toString()}` : ''}`

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={exportHref} download>
            <Download className="size-4" />
            {t('exportCsv')}
          </a>
        </Button>
      </header>

      <LogsFilters modules={modules} users={users} />

      <div className="text-muted-foreground text-xs">{t('totalCount', { count: total })}</div>

      <div className="border-border rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">{t('columns.timestamp')}</TableHead>
              <TableHead className="w-[140px]">{t('columns.module')}</TableHead>
              <TableHead>{t('columns.event')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('columns.user')}</TableHead>
              <TableHead className="text-right">{t('columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={5} className="text-destructive py-8 text-center">
                  {error.message}
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                  {tc('noResults')}
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">
                    {formatDateTime(log.created_at)}
                  </TableCell>
                  <TableCell>
                    {log.module ? (
                      <Badge variant="outline">{log.module}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.event_name ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-xs md:table-cell">
                    {log.email ?? <span className="font-mono">{log.user ?? '—'}</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <LogPayloadSheet log={log} />
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
