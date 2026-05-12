import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/guards'
import { BannerFormDialog } from './_components/banner-form-dialog'
import { BannerCard } from './_components/banner-card'
import type { Oferta } from '@/types/entities'

export default async function BannerPage() {
  await requireAdmin()
  const t = await getTranslations('banner')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('Ofertas')
    .select('*')
    .order('createdAt', { ascending: false })

  const banners = (data ?? []) as unknown as Oferta[]

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        </div>
        <BannerFormDialog />
      </header>

      {error ? (
        <div className="text-destructive border-border rounded-lg border p-6 text-center">
          {error.message}
        </div>
      ) : banners.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-lg border p-12 text-center">
          {t('empty')}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {banners.map((b) => (
            <BannerCard key={b.id} banner={b} />
          ))}
        </div>
      )}
    </div>
  )
}
