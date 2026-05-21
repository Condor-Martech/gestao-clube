import { Star, MessageSquare, TrendingDown, Smartphone } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export interface KpiData {
  ratingPlay: number | null
  ratingAppStore: number | null
  reviewsLast30d: number
  negativeRatePct: number | null
}

interface Props {
  data: KpiData
}

export async function KpiCards({ data }: Props) {
  const t = await getTranslations('stores.kpis')

  const cards = [
    {
      label: t('ratingPlay'),
      description: t('ratingPlayDesc'),
      value: formatRating(data.ratingPlay),
      icon: Star,
    },
    {
      label: t('ratingAppStore'),
      description: t('ratingAppStoreDesc'),
      value: formatRating(data.ratingAppStore),
      icon: Smartphone,
    },
    {
      label: t('reviewsLast30d'),
      description: t('reviewsLast30dDesc'),
      value: data.reviewsLast30d.toLocaleString('pt-BR'),
      icon: MessageSquare,
    },
    {
      label: t('negativeRate'),
      description: t('negativeRateDesc'),
      value: data.negativeRatePct === null ? '—' : `${data.negativeRatePct.toFixed(1)}%`,
      icon: TrendingDown,
    },
  ]

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, description, value, icon: Icon }) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <CardDescription className="text-xs">{description}</CardDescription>
            </div>
            <Icon className="text-muted-foreground size-5 shrink-0" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{value}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}

function formatRating(value: number | null): string {
  if (value === null) return '—'
  return value.toFixed(2).replace('.', ',')
}
