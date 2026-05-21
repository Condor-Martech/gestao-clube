import { CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { formatRelative } from '@/lib/utils/format'
import type { Store } from '@/lib/stores/types'

export interface SyncStateRow {
  store: Store
  last_synced_at: string | null
  last_error: string | null
}

interface Props {
  rows: SyncStateRow[]
}

export async function SyncStatusList({ rows }: Props) {
  const t = await getTranslations('stores.syncStatus')

  const stores: Store[] = ['play', 'app_store']
  const byStore = new Map(rows.map((r) => [r.store, r]))

  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      {stores.map((store) => {
        const row = byStore.get(store)
        const label = store === 'play' ? t('playLabel') : t('appStoreLabel')

        if (!row || !row.last_synced_at) {
          return (
            <span key={store} className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              <strong className="text-foreground font-medium">{label}:</strong>
              {t('never')}
            </span>
          )
        }

        if (row.last_error) {
          return (
            <span key={store} className="text-destructive inline-flex items-center gap-1.5">
              <AlertCircle className="size-3.5" />
              <strong className="font-medium">{label}:</strong>
              <span title={row.last_error}>{t('error')}</span>
              <span className="text-muted-foreground">· {formatRelative(row.last_synced_at)}</span>
            </span>
          )
        }

        return (
          <span key={store} className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            <strong className="text-foreground font-medium">{label}:</strong>
            {formatRelative(row.last_synced_at)}
          </span>
        )
      })}
    </div>
  )
}
