import Link from 'next/link'
import { ArrowRight, CheckCircle2, Layers, Megaphone, Package } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { requireModuleRead } from '@/lib/auth/guards'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils/format'
import { LogPayloadSheet } from '@/app/(dashboard)/logs/_components/log-payload-sheet'
import type { LogEntry } from '@/types/entities'
import { ProdutosPorCampanhaChart } from './_components/produtos-por-campanha-chart'
import { CampanhasSituacaoChart } from './_components/campanhas-situacao-chart'

const RECENT_LOGS_LIMIT = 8
const TOP_CAMPANHAS = 8
// Tope de filas leídas de Produtos para o gráfico produtos-por-campanha.
// Supabase pagina os resultados; se a tabela superar este tope, o gráfico
// é uma amostra e o subtítulo do card o deixa explícito.
const PRODUTOS_SAMPLE = 5000
const PAYLOAD_SUMMARY_KEYS = ['nome', 'name', 'title', 'descricao', 'description']

/** Extrai um resumo curto e legível do payload JSONB de um log. */
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

export default async function OfertasDashboardPage() {
  await requireModuleRead('ofertas')
  const t = await getTranslations('ofertasDashboard')
  const tLogs = await getTranslations('logs')
  const supabase = await createClient()

  const [
    campanhasCountRes,
    produtosCountRes,
    aprovadosRes,
    agrupamentosRes,
    produtosCampanhaRes,
    campanhasDataRes,
    logsRes,
  ] = await Promise.all([
    supabase.from('campanhas').select('id', { count: 'exact', head: true }),
    supabase.from('Produtos').select('id', { count: 'exact', head: true }),
    supabase.from('produtos_pai').select('id', { count: 'exact', head: true }).eq('aproved', true),
    supabase.from('Agrupamentos').select('id', { count: 'exact', head: true }),
    supabase
      .from('Produtos')
      .select('campanha')
      .not('campanha', 'is', null)
      .order('id', { ascending: false })
      .limit(PRODUTOS_SAMPLE),
    supabase.from('campanhas').select('cod_campanha, nom_campanha, dsc_situacao'),
    supabase
      .from('logs_with_users')
      .select('*')
      .eq('module', 'ofertas')
      .order('created_at', { ascending: false })
      .limit(RECENT_LOGS_LIMIT),
  ])

  // Uma query com erro devolve `count: null`. Propagamos `null` (em vez de
  // mascarar com `0`) para que o KPI mostre "—" e não um número enganoso.
  const kpis = [
    {
      label: t('kpis.campanhas'),
      description: t('kpis.campanhasDesc'),
      value: campanhasCountRes.error ? null : (campanhasCountRes.count ?? 0),
      icon: Megaphone,
    },
    {
      label: t('kpis.produtos'),
      description: t('kpis.produtosDesc'),
      value: produtosCountRes.error ? null : (produtosCountRes.count ?? 0),
      icon: Package,
    },
    {
      label: t('kpis.produtosAprovados'),
      description: t('kpis.produtosAprovadosDesc'),
      value: aprovadosRes.error ? null : (aprovadosRes.count ?? 0),
      icon: CheckCircle2,
    },
    {
      label: t('kpis.agrupamentos'),
      description: t('kpis.agrupamentosDesc'),
      value: agrupamentosRes.error ? null : (agrupamentosRes.count ?? 0),
      icon: Layers,
    },
  ]

  // Produtos por campanha: mapeia o código (Produtos.campanha) para o nome.
  const campanhaNomePorCodigo = new Map<string, string>()
  const situacaoCount = new Map<string, number>()
  for (const row of campanhasDataRes.data ?? []) {
    const c = row as {
      cod_campanha: string | null
      nom_campanha: string | null
      dsc_situacao: string | null
    }
    if (c.cod_campanha) {
      campanhaNomePorCodigo.set(c.cod_campanha, c.nom_campanha?.trim() || c.cod_campanha)
    }
    const situacao = c.dsc_situacao?.trim() || t('charts.semSituacao')
    situacaoCount.set(situacao, (situacaoCount.get(situacao) ?? 0) + 1)
  }

  const produtosPorCodigo = new Map<string, number>()
  for (const row of produtosCampanhaRes.data ?? []) {
    const cod = (row as { campanha: string | null }).campanha
    if (cod) produtosPorCodigo.set(cod, (produtosPorCodigo.get(cod) ?? 0) + 1)
  }
  const produtosPorCampanha = [...produtosPorCodigo.entries()]
    .map(([cod, total]) => ({
      campanha: campanhaNomePorCodigo.get(cod) ?? cod,
      total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, TOP_CAMPANHAS)

  // O gráfico se computa sobre as filas lidas de Produtos. Se a tabela
  // superar PRODUTOS_SAMPLE, é uma amostra — o subtítulo o torna explícito.
  const produtosLidos = produtosCampanhaRes.data?.length ?? 0
  const produtosTotal = produtosCountRes.count ?? 0
  const produtosPorCampanhaEhAmostra = produtosTotal > produtosLidos

  const campanhasPorSituacao = [...situacaoCount.entries()]
    .map(([situacao, total]) => ({ situacao, total }))
    .sort((a, b) => b.total - a.total)

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
                <CardDescription className="text-xs">{description}</CardDescription>
              </div>
              <Icon className="text-muted-foreground size-5 shrink-0" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">
                {value === null ? '—' : value.toLocaleString('pt-BR')}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('charts.produtosPorCampanha')}</CardTitle>
            <CardDescription>
              {produtosPorCampanhaEhAmostra
                ? t('charts.produtosPorCampanhaAmostra', {
                    amostra: produtosLidos.toLocaleString('pt-BR'),
                    total: produtosTotal.toLocaleString('pt-BR'),
                  })
                : t('charts.produtosPorCampanhaDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProdutosPorCampanhaChart data={produtosPorCampanha} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('charts.campanhasPorSituacao')}</CardTitle>
            <CardDescription>{t('charts.campanhasPorSituacaoDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <CampanhasSituacaoChart data={campanhasPorSituacao} />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">{t('recentLogs.title')}</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/logs?module=ofertas">
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
                <TableHead>{tLogs('columns.event')}</TableHead>
                <TableHead className="hidden md:table-cell">{tLogs('columns.user')}</TableHead>
                <TableHead className="w-[120px] text-right">{tLogs('columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsRes.error ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-destructive py-8 text-center">
                    {t('recentLogs.loadError')}
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
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
    </div>
  )
}
