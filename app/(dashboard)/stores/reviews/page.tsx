import { getTranslations } from 'next-intl/server'
import { requireModuleRead } from '@/lib/auth/guards'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ReviewsPage() {
  await requireModuleRead('stores')
  const t = await getTranslations('stores.stubs')
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reviewsTitle')}</CardTitle>
        <CardDescription>{t('reviewsDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{t('comingSoon')}</p>
      </CardContent>
    </Card>
  )
}
