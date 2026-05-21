import { AlertTriangle, ShieldCheck } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  getSensitiveProdutosInCampanhas,
  type SensitiveProduto,
} from '@/lib/sensitive-products'
import { getAlertasConfig } from '@/lib/alertas/config'

const NEW_WINDOW_MS = 24 * 60 * 60 * 1000
const DISPLAY_LIMIT = 8

function isNew(p: SensitiveProduto): boolean {
  if (!p.updated_at) return false
  return Date.now() - new Date(p.updated_at).getTime() <= NEW_WINDOW_MS
}

export async function SensitiveProductsCard() {
  const t = await getTranslations('dashboard.sensitiveProducts')
  const supabase = await createClient()

  let produtos: SensitiveProduto[]
  try {
    const config = await getAlertasConfig(supabase)
    produtos = await getSensitiveProdutosInCampanhas(supabase, {
      keywords: config.keywords,
      limit: 50,
    })
  } catch {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">{t('loadError')}</p>
        </CardContent>
      </Card>
    )
  }

  const novos = produtos.filter(isNew).length
  const hasAlert = produtos.length > 0

  return (
    <Card
      className={
        hasAlert
          ? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20'
          : undefined
      }
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">{t('title')}</CardTitle>
          <CardDescription className="text-xs">
            {t('description')}
          </CardDescription>
        </div>
        {hasAlert ? (
          <AlertTriangle className="size-5 shrink-0 text-amber-600" />
        ) : (
          <ShieldCheck className="text-muted-foreground size-5 shrink-0" />
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasAlert ? (
          <p className="text-muted-foreground text-sm">{t('empty')}</p>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tabular-nums">
                {produtos.length}
              </span>
              {novos > 0 && (
                <Badge className="bg-amber-600 hover:bg-amber-600">
                  {t('newCount', { count: novos })}
                </Badge>
              )}
            </div>
            <ul className="divide-border divide-y text-sm">
              {produtos.slice(0, DISPLAY_LIMIT).map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2 py-1.5"
                >
                  <span className="truncate font-medium">
                    {p.nome ?? p.ean ?? '—'}
                  </span>
                  <span className="text-muted-foreground flex shrink-0 items-center gap-2 text-xs">
                    {p.campanha && (
                      <Badge variant="outline">{p.campanha}</Badge>
                    )}
                    {isNew(p) && (
                      <span className="font-medium text-amber-600">
                        {t('newTag')}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            {produtos.length > DISPLAY_LIMIT && (
              <p className="text-muted-foreground text-xs">
                {t('andMore', { count: produtos.length - DISPLAY_LIMIT })}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
