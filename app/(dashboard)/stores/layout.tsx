import { AlertCircle } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireSession } from '@/lib/auth/guards'
import { listApps, getSyncState } from '@/lib/stores/repository'
import { SyncButton } from './_components/sync-button'
import { SyncStatusList } from './_components/sync-status-list'
import { TabsNav, type TabItem } from './_components/tabs-nav'

export default async function StoresLayout({ children }: { children: React.ReactNode }) {
  await requireSession()
  const t = await getTranslations('stores')
  const apps = await listApps()

  if (apps.length === 0) {
    return <EmptyApps />
  }

  const app = apps[0]!
  const syncStateRows = await getSyncState(app.id)

  const tabs: TabItem[] = [
    { href: '/stores', label: t('tabs.overview') },
    { href: '/stores/reviews', label: t('tabs.reviews') },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground text-sm">{t('subtitle', { app: app.name })}</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <SyncButton appId={app.id} />
          <SyncStatusList rows={syncStateRows} />
        </div>
      </header>

      <TabsNav tabs={tabs} />

      <div>{children}</div>
    </div>
  )
}

async function EmptyApps() {
  const t = await getTranslations('stores.empty')
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertCircle className="text-muted-foreground mt-0.5 size-5 shrink-0" />
            <div className="space-y-1">
              <CardTitle className="text-base">{t('noAppsTitle')}</CardTitle>
              <CardDescription>{t('noAppsDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs">
            {`INSERT INTO public.cc_apps (name, play_package_name, app_store_id)
VALUES ('Clube Condor', 'br.com.condor.YOURPKG', '1234567890');`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
