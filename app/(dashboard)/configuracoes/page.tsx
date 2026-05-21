import { getTranslations } from 'next-intl/server'
import { requireModuleRead } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { getAlertasConfig } from '@/lib/alertas/config'
import { AlertasConfigForm } from './_components/alertas-config-form'

export default async function ConfiguracoesPage() {
  await requireModuleRead('sistemas')
  const t = await getTranslations('configuracoes')
  const supabase = await createClient()
  const config = await getAlertasConfig(supabase)

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      <AlertasConfigForm config={config} />
    </div>
  )
}
