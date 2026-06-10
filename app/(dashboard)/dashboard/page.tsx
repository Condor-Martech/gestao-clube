import Link from 'next/link'
import {
  Layers,
  CheckCircle2,
  Package,
  Megaphone,
  ArrowRight,
  Image as ImageIcon,
  Ticket,
  Store,
  BadgeCheck,
  Newspaper,
  MapPin,
  Users,
  ShoppingBag,
  FileText,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/guards'
import { hasModuleAccess } from '@/lib/rbac'
import { env } from '@/lib/env'
import { createStrapiClient } from '@/lib/strapi/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { formatDateTime } from '@/lib/utils/format'
import { LogPayloadSheet } from '@/app/(dashboard)/logs/_components/log-payload-sheet'
import type { LogEntry } from '@/types/entities'

const RECENT_LOGS_LIMIT = 10
const PAYLOAD_SUMMARY_KEYS = ['nome', 'name', 'title', 'descricao', 'description']

type KpiValue = number | null
type ModuleKey = 'ofertas' | 'conteudo' | 'stores' | 'operacionais' | 'sistema'

interface Kpi {
  label: string
  description: string
  value: KpiValue
  icon: LucideIcon
  module: ModuleKey
}

interface Shortcut {
  href: string
  label: string
  description: string
  icon: LucideIcon
}

function summarizePayload(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const obj = payload as Record<string, unknown>
  const parts: string[] = []
  for (const key of PAYLOAD_SUMMARY_KEYS) {
    const v = obj[key]
    if (typeof v === 'string' && v.trim() && parts.length < 2) {
      parts.push(v.trim())
    }
  }
  return parts.length > 0 ? parts.join(' · ') : null
}

function settledCount(result: PromiseSettledResult<{ count: number | null }>): KpiValue {
  if (result.status !== 'fulfilled') return null
  return result.value.count ?? 0
}

function formatKpi(value: KpiValue): string {
  return value === null ? '—' : value.toLocaleString('pt-BR')
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export default async function DashboardPage() {
  const t = await getTranslations('dashboard')
  const tLogs = await getTranslations('logs')
  const { isAdmin, moduleRoles } = await requireSession()
  const supabase = await createClient()

  const canOfertas = hasModuleAccess(isAdmin, 'ofertas', moduleRoles)
  const canConteudo = hasModuleAccess(isAdmin, 'conteudo', moduleRoles)
  const canStores = hasModuleAccess(isAdmin, 'stores', moduleRoles)
  const canOperacionais = hasModuleAccess(isAdmin, 'operacionais', moduleRoles)
  const canSistemas = hasModuleAccess(isAdmin, 'sistemas', moduleRoles)

  const ofertasPromise = canOfertas
    ? Promise.allSettled([
        supabase.from('Agrupamentos').select('id', { count: 'exact', head: true }),
        supabase
          .from('produtos_pai')
          .select('id', { count: 'exact', head: true })
          .eq('aproved', true),
        supabase.from('Produtos').select('id', { count: 'exact', head: true }),
        supabase.from('campanhas').select('id', { count: 'exact', head: true }),
      ])
    : null

  const conteudoPromise = canConteudo
    ? (async () => {
        const client = createStrapiClient({
          url: env.STRAPI_API_URL,
          token: env.STRAPI_API_TOKEN,
        })
        return Promise.allSettled([
          client.list<unknown>('banner-super-apps', {
            'pagination[pageSize]': 1,
            publicationState: 'live',
          }),
          client.list<unknown>('numero-da-sortes', {
            'pagination[pageSize]': 200,
            publicationState: 'live',
          }),
        ])
      })()
    : null

  const storesPromise = canStores
    ? Promise.allSettled([
        supabase.from('Lojas').select('id', { count: 'exact', head: true }),
        supabase.from('Lojas').select('id', { count: 'exact', head: true }).eq('status', true),
      ])
    : null

  const operacionaisPromise = canOperacionais
    ? Promise.allSettled([
        supabase.from('Tabloides').select('id', { count: 'exact', head: true }),
        supabase.from('Ofertas').select('id', { count: 'exact', head: true }),
      ])
    : null

  const sistemasPromise = canSistemas
    ? Promise.allSettled([supabase.from('users_system').select('id', { count: 'exact', head: true })])
    : null

  const logsPromise = supabase
    .from('logs_with_users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(RECENT_LOGS_LIMIT)

  const [ofertasRes, conteudoRes, storesRes, operacionaisRes, sistemasRes, logsRes] =
    await Promise.all([
      ofertasPromise,
      conteudoPromise,
      storesPromise,
      operacionaisPromise,
      sistemasPromise,
      logsPromise,
    ])

  const ofertasKpis: Kpi[] = ofertasRes
    ? [
        {
          label: t('kpis.agrupamentos'),
          description: t('kpis.agrupamentosDesc'),
          value: settledCount(ofertasRes[0]),
          icon: Layers,
          module: 'ofertas',
        },
        {
          label: t('kpis.produtosAprovados'),
          description: t('kpis.produtosAprovadosDesc'),
          value: settledCount(ofertasRes[1]),
          icon: CheckCircle2,
          module: 'ofertas',
        },
        {
          label: t('kpis.produtosSincronizados'),
          description: t('kpis.produtosSincronizadosDesc'),
          value: settledCount(ofertasRes[2]),
          icon: Package,
          module: 'ofertas',
        },
        {
          label: t('kpis.campanhas'),
          description: t('kpis.campanhasDesc'),
          value: settledCount(ofertasRes[3]),
          icon: Megaphone,
          module: 'ofertas',
        },
      ]
    : []

  let bannersCount: KpiValue = null
  let sorteiosAtivosCount: KpiValue = null
  if (conteudoRes) {
    const [bannersResult, sorteiosResult] = conteudoRes
    if (
      bannersResult.status === 'fulfilled' &&
      bannersResult.value.ok &&
      Array.isArray(bannersResult.value.data)
    ) {
      bannersCount = bannersResult.value.data.length
    }
    if (
      sorteiosResult.status === 'fulfilled' &&
      sorteiosResult.value.ok &&
      Array.isArray(sorteiosResult.value.data)
    ) {
      const today = todayIsoDate()
      const items = sorteiosResult.value.data.map((raw) => {
        const r = raw as { attributes?: Record<string, unknown> } & Record<string, unknown>
        const attrs = (r.attributes ?? r) as Record<string, unknown>
        const start = (attrs.Start ?? attrs.startDate) as string | undefined
        const end = (attrs.End ?? attrs.endDate) as string | undefined
        const publishedAt = (attrs.publishedAt as string | null | undefined) ?? null
        return { start, end, publishedAt }
      })
      sorteiosAtivosCount = items.filter(
        (i) => i.publishedAt !== null && i.start && i.end && i.start <= today && today <= i.end,
      ).length
    }
  }

  const conteudoKpis: Kpi[] = canConteudo
    ? [
        {
          label: t('kpis.banners'),
          description: t('kpis.bannersDesc'),
          value: bannersCount,
          icon: ImageIcon,
          module: 'conteudo',
        },
        {
          label: t('kpis.sorteios'),
          description: t('kpis.sorteiosDesc'),
          value: sorteiosAtivosCount,
          icon: Ticket,
          module: 'conteudo',
        },
      ]
    : []

  const storesKpis: Kpi[] = storesRes
    ? [
        {
          label: t('kpis.lojas'),
          description: t('kpis.lojasDesc'),
          value: settledCount(storesRes[0]),
          icon: Store,
          module: 'stores',
        },
        {
          label: t('kpis.lojasAtivas'),
          description: t('kpis.lojasAtivasDesc'),
          value: settledCount(storesRes[1]),
          icon: BadgeCheck,
          module: 'stores',
        },
      ]
    : []

  const operacionaisKpis: Kpi[] = operacionaisRes
    ? [
        {
          label: t('kpis.tabloides'),
          description: t('kpis.tabloidesDesc'),
          value: settledCount(operacionaisRes[0]),
          icon: Newspaper,
          module: 'operacionais',
        },
        {
          label: t('kpis.ofertasRegiao'),
          description: t('kpis.ofertasRegiaoDesc'),
          value: settledCount(operacionaisRes[1]),
          icon: MapPin,
          module: 'operacionais',
        },
      ]
    : []

  const sistemaKpis: Kpi[] = sistemasRes
    ? [
        {
          label: t('kpis.usuarios'),
          description: t('kpis.usuariosDesc'),
          value: settledCount(sistemasRes[0]),
          icon: Users,
          module: 'sistema',
        },
      ]
    : []

  const allKpis: Kpi[] = [
    ...ofertasKpis,
    ...conteudoKpis,
    ...storesKpis,
    ...operacionaisKpis,
    ...sistemaKpis,
  ]

  const logs = (logsRes.data ?? []) as unknown as LogEntry[]

  const shortcuts: Shortcut[] = [
    canOfertas && {
      href: '/ofertas',
      label: t('shortcuts.ofertasLabel'),
      description: t('shortcuts.ofertasDescription'),
      icon: ShoppingBag,
    },
    canConteudo && {
      href: '/banner-super-app',
      label: t('shortcuts.conteudoLabel'),
      description: t('shortcuts.conteudoDescription'),
      icon: ImageIcon,
    },
    canStores && {
      href: '/lojas',
      label: t('shortcuts.storesLabel'),
      description: t('shortcuts.storesDescription'),
      icon: Store,
    },
    canOperacionais && {
      href: '/tabloides',
      label: t('shortcuts.operacionaisLabel'),
      description: t('shortcuts.operacionaisDescription'),
      icon: FileText,
    },
    canSistemas && {
      href: '/users',
      label: t('shortcuts.sistemasLabel'),
      description: t('shortcuts.sistemasDescription'),
      icon: Settings,
    },
  ].filter((s): s is Shortcut => Boolean(s))

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      {allKpis.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allKpis.map(({ label, description, value, icon: Icon, module }) => (
            <Card key={`${module}-${label}`}>
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="text-[10px] font-medium uppercase">
                    {t(`modules.${module}`)}
                  </Badge>
                  <Icon className="text-muted-foreground size-5 shrink-0" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium">{label}</CardTitle>
                  <CardDescription className="text-xs">{description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">{formatKpi(value)}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">{t('recentLogs.title')}</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/logs">
              {t('recentLogs.viewAll')}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="border-border overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">{tLogs('columns.timestamp')}</TableHead>
                <TableHead className="w-[140px]">{tLogs('columns.module')}</TableHead>
                <TableHead>{tLogs('columns.event')}</TableHead>
                <TableHead className="hidden md:table-cell">{tLogs('columns.user')}</TableHead>
                <TableHead className="w-[140px] text-right">{tLogs('columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsRes.error ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-destructive py-8 text-center">
                    {t('recentLogs.loadError')}
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                    {t('recentLogs.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const summary = summarizePayload(log.payload)
                  return (
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
                      <TableCell className="max-w-[420px]">
                        <div className="flex flex-col leading-tight">
                          <span className="font-medium">
                            {log.event_name ?? <span className="text-muted-foreground">—</span>}
                          </span>
                          {summary && (
                            <span className="text-muted-foreground truncate text-xs">
                              {summary}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden text-xs md:table-cell">
                        {log.email ?? <span className="font-mono">{log.user ?? '—'}</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <LogPayloadSheet log={log} />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {shortcuts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">{t('shortcuts.title')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shortcuts.map(({ href, label, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="border-border hover:border-foreground/30 hover:bg-muted/40 group rounded-lg border p-4 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className="text-muted-foreground size-4" />
                      <span className="font-medium">{label}</span>
                    </div>
                    <p className="text-muted-foreground text-xs">{description}</p>
                  </div>
                  <span className="text-muted-foreground group-hover:text-foreground flex items-center gap-1 text-xs">
                    {t('shortcuts.go')}
                    <ArrowRight className="size-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
