import { getTranslations } from 'next-intl/server'
import { CheckCircle2, XCircle, Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireModuleRead } from '@/lib/auth/guards'
import { Badge } from '@/components/ui/badge'
import { HistoryFilters } from './_components/history-filters'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { formatDateTime } from '@/lib/utils/format'
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  rangeFromPage,
  totalPages,
} from '@/lib/utils/pagination'
import { pickString } from '@/lib/utils/search-params'
import type { AuditActivation } from '@/types/entities'

interface Props {
  searchParams: Promise<{
    from?: string | string[]
    to?: string | string[]
    page?: string | string[]
  }>
}

export default async function HistoryPage({ searchParams }: Props) {
  await requireModuleRead('operacionais')
  const sp = await searchParams
  const t = await getTranslations('history')

  const from = pickString(sp.from)
  const to = pickString(sp.to)
  const page = parsePage(pickString(sp.page))
  const range = rangeFromPage({ page, pageSize: DEFAULT_PAGE_SIZE })

  const supabase = await createClient()
  let query = supabase
    .from('audit_offer_activation_v2')
    .select('*', { count: 'exact' })
    .order('timestamp', { ascending: false })
    .range(range.from, range.to)

  if (from) query = query.gte('timestamp', `${from}T00:00:00.000Z`)
  if (to) query = query.lte('timestamp', `${to}T23:59:59.999Z`)

  const { data, count, error } = await query

  const events = (data ?? []) as unknown as AuditActivation[]
  const total = count ?? 0
  const pages = totalPages(total, DEFAULT_PAGE_SIZE)

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      <HistoryFilters />

      <div className="space-y-2">
        {error ? (
          <div className="text-destructive border-border rounded-lg border p-6 text-center">
            {error.message}
          </div>
        ) : events.length === 0 ? (
          <div className="text-muted-foreground border-border rounded-lg border p-12 text-center">
            {t('empty')}
          </div>
        ) : (
          events.map((event) => {
            const isCancel = event.action === 'cancel'
            const isFailed = event.status === 'failed'
            const Icon = isFailed ? XCircle : isCancel ? Activity : CheckCircle2

            return (
              <article
                key={event.id}
                className="border-border bg-card flex items-start gap-3 rounded-lg border p-4"
              >
                <div
                  className={
                    isFailed
                      ? 'text-destructive mt-0.5'
                      : isCancel
                        ? 'text-amber-500 mt-0.5'
                        : 'text-emerald-500 mt-0.5'
                  }
                >
                  <Icon className="size-5 shrink-0" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {isCancel ? t('actionCancel') : t('actionActivate')}
                    </span>
                    <Badge variant={isFailed ? 'destructive' : 'success'}>
                      {isFailed ? t('statusFailed') : t('statusSuccess')}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {formatDateTime(event.timestamp)}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {event.campaign_code && (
                      <span className="font-mono">campaign: {event.campaign_code}</span>
                    )}
                    {event.product_id && (
                      <span className="font-mono ml-3">product: {event.product_id}</span>
                    )}
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>

      {total > DEFAULT_PAGE_SIZE && (
        <PaginationControls page={page} totalPages={pages} />
      )}
    </div>
  )
}
