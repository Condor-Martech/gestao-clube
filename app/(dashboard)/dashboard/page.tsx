import Link from 'next/link'
import { Layers, CheckCircle2, Package, Megaphone, ArrowRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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

export default async function DashboardPage() {
  const t = await getTranslations('dashboard')
  const tLogs = await getTranslations('logs')
  const supabase = await createClient()

  const [
    agrupamentosRes,
    aprovadosRes,
    produtosTotalRes,
    produtosCampanhasRes,
    logsRes,
  ] = await Promise.all([
    supabase
      .from('Agrupamentos')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('produtos_pai')
      .select('id', { count: 'exact', head: true })
      .eq('aproved', true),
    supabase
      .from('Produtos')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('Produtos')
      .select('campanha')
      .not('campanha', 'is', null),
    supabase
      .from('logs_with_users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(RECENT_LOGS_LIMIT),
  ])

  const campanhasComProdutos = new Set(
    (produtosCampanhasRes.data ?? []).map(
      (r) => (r as { campanha: string | null }).campanha,
    ),
  ).size

  const kpis = [
    {
      label: t('kpis.agrupamentos'),
      description: t('kpis.agrupamentosDesc'),
      value: agrupamentosRes.count ?? 0,
      icon: Layers,
    },
    {
      label: t('kpis.produtosAprovados'),
      description: t('kpis.produtosAprovadosDesc'),
      value: aprovadosRes.count ?? 0,
      icon: CheckCircle2,
    },
    {
      label: t('kpis.produtosSincronizados'),
      description: t('kpis.produtosSincronizadosDesc'),
      value: produtosTotalRes.count ?? 0,
      icon: Package,
    },
    {
      label: t('kpis.campanhasComProdutos'),
      description: t('kpis.campanhasComProdutosDesc'),
      value: campanhasComProdutos,
      icon: Megaphone,
    },
  ]

  const logs = (logsRes.data ?? []) as unknown as LogEntry[]

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, description, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <CardDescription className="text-xs">
                  {description}
                </CardDescription>
              </div>
              <Icon className="text-muted-foreground size-5 shrink-0" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">
                {value.toLocaleString('pt-BR')}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            {t('recentLogs.title')}
          </h2>
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
                <TableHead className="w-[180px]">
                  {tLogs('columns.timestamp')}
                </TableHead>
                <TableHead className="w-[140px]">
                  {tLogs('columns.module')}
                </TableHead>
                <TableHead>{tLogs('columns.event')}</TableHead>
                <TableHead className="hidden md:table-cell">
                  {tLogs('columns.user')}
                </TableHead>
                <TableHead className="w-[140px] text-right">
                  {tLogs('columns.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsRes.error ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-destructive py-8 text-center"
                  >
                    {t('recentLogs.loadError')}
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground py-8 text-center"
                  >
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
                            {log.event_name ?? (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </span>
                          {summary && (
                            <span className="text-muted-foreground truncate text-xs">
                              {summary}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden text-xs md:table-cell">
                        {log.email ?? (
                          <span className="font-mono">{log.user ?? '—'}</span>
                        )}
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
    </div>
  )
}
