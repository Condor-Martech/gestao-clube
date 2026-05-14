import Link from 'next/link'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Package,
  Tag,
  Building2,
  Calendar,
  User,
  ExternalLink,
  Copy,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDateTime } from '@/lib/utils/format'
import type { Produto, Agrupamento, LogEntry } from '@/types/entities'
import type { LojaDisponivel } from '../page'
import { LojasTab } from './lojas-tab'
import { LogsTab } from './logs-tab'

interface Props {
  produto: Produto
  isPai: boolean
  agrupamentos: Agrupamento[]
  paiProduto: Produto | null
  approverEmail: string | null
  userEmailMap: Map<string, string>
  isDuplicate: boolean
  allDuplicates: Produto[]
  lojas: LojaDisponivel[]
  logs: LogEntry[]
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
      {children}
    </h3>
  )
}

function FieldRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <span className="text-muted-foreground mt-0.5 size-4 shrink-0">{icon}</span>
      <span className="text-muted-foreground w-28 shrink-0 text-sm">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

function CheckRow({ label, ok, detail }: { label: string; ok: boolean; detail?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      {ok ? (
        <CheckCircle2 className="size-4 shrink-0 text-green-500" />
      ) : (
        <XCircle className="text-destructive size-4 shrink-0" />
      )}
      <span className="w-24 shrink-0 text-sm">{label}</span>
      {detail && <span className="text-muted-foreground text-xs">{detail}</span>}
    </div>
  )
}

export async function JornadaCard({
  produto,
  isPai,
  agrupamentos,
  paiProduto,
  approverEmail,
  userEmailMap,
  isDuplicate,
  allDuplicates,
  lojas,
  logs,
}: Props) {
  const t = await getTranslations('jornadaProduto')

  const hasNome = !!produto.nome?.trim()
  const hasDescricao = !!produto.descricao?.trim()
  const hasImagem = !!produto.img_external?.trim()

  return (
    <div className="border-border bg-card rounded-xl border shadow-sm">
      {/* ── DUPLICATE WARNING ── */}
      {isDuplicate && (
        <div className="bg-amber-500/10 border-amber-500/30 flex items-start gap-3 rounded-t-xl border-b px-5 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              {t('sections.duplicates')}
            </p>
            <p className="text-muted-foreground text-xs">
              {t('duplicates.warning', { count: allDuplicates.length })}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {allDuplicates.map((d) => (
                <span
                  key={d.id}
                  className="border-amber-300/50 bg-amber-500/10 inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs"
                >
                  <span className="font-mono font-medium">{d.campanha ?? '—'}</span>
                  {d.aproved ? (
                    <CheckCircle2 className="size-3 text-green-500" />
                  ) : (
                    <XCircle className="text-muted-foreground size-3" />
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER: IMAGE + IDENTITY ── */}
      <div className="flex gap-5 p-5">
        {/* Thumbnail */}
        <div className="border-border bg-muted flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
          {hasImagem ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={produto.img_external!}
              alt={produto.nome ?? 'produto'}
              className="size-full object-contain"
            />
          ) : (
            <Package className="text-muted-foreground/40 size-8" />
          )}
        </div>

        {/* Identity */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold">
              {produto.nome ?? <span className="text-muted-foreground italic">sem nome</span>}
            </h2>
            <Badge variant={isPai ? 'default' : 'secondary'}>
              {isPai ? t('hierarchy.pai') : t('hierarchy.filho')}
            </Badge>
            <Badge variant={produto.aproved ? 'success' : 'outline'}>
              {produto.aproved ? t('approval.approved') : t('approval.notApproved')}
            </Badge>
          </div>

          <div className="mt-1 grid grid-cols-1 gap-x-6 gap-y-0.5 sm:grid-cols-2">
            <FieldRow
              icon={<Tag className="size-4" />}
              label={t('identity.ean')}
              value={<span className="font-mono text-xs">{produto.ean ?? '—'}</span>}
            />
            <FieldRow
              icon={<Building2 className="size-4" />}
              label={t('identity.campanha')}
              value={
                produto.campanha ? (
                  <Link
                    href={`/produtos/${produto.campanha}` as `/${string}`}
                    className="hover:text-primary inline-flex items-center gap-1 font-mono text-xs underline-offset-2 hover:underline"
                  >
                    {produto.campanha}
                    <ExternalLink className="size-3" />
                  </Link>
                ) : (
                  '—'
                )
              }
            />
            {produto.host && (
              <FieldRow
                icon={<Copy className="size-4" />}
                label={t('identity.host')}
                value={<span className="font-mono text-xs">{produto.host}</span>}
              />
            )}
            {produto.created_at && (
              <FieldRow
                icon={<Calendar className="size-4" />}
                label={t('identity.createdAt')}
                value={<span className="text-xs">{formatDateTime(produto.created_at)}</span>}
              />
            )}
            {produto.updated_at && (
              <FieldRow
                icon={<Calendar className="size-4" />}
                label={t('identity.updatedAt')}
                value={<span className="text-xs">{formatDateTime(produto.updated_at)}</span>}
              />
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* ── TABS: GERAL / DISPONIBILIDADE ── */}
      <div className="px-5 py-4">
        <Tabs defaultValue="geral">
          <TabsList>
            <TabsTrigger value="geral">{t('tabs.geral')}</TabsTrigger>
            <TabsTrigger value="disponibilidade">
              {t('tabs.disponibilidade')}
              {lojas.length > 0 && (
                <span className="bg-muted ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-normal">
                  {lojas.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="logs">
              {t('tabs.logs')}
              {logs.length > 0 && (
                <span className="bg-muted ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-normal">
                  {logs.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-4 pt-4">
            {/* ── DADOS ESSENCIAIS ── */}
            <div>
              <SectionTitle>{t('sections.essentialData')}</SectionTitle>
              <CheckRow
                label={t('essentialData.nome')}
                ok={hasNome}
                detail={hasNome ? produto.nome! : undefined}
              />
              <CheckRow
                label={t('essentialData.descricao')}
                ok={hasDescricao}
                detail={
                  hasDescricao ? (
                    <span className="line-clamp-1">{produto.descricao!}</span>
                  ) : undefined
                }
              />
              <CheckRow
                label={t('essentialData.imagem')}
                ok={hasImagem}
                detail={
                  hasImagem ? (
                    <a
                      href={produto.img_external!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary inline-flex items-center gap-1 underline-offset-2 hover:underline"
                    >
                      ver imagem
                      <ExternalLink className="size-3" />
                    </a>
                  ) : undefined
                }
              />
            </div>

            <Separator />

            {/* ── APROVAÇÃO ── */}
            <div>
              <SectionTitle>{t('sections.approval')}</SectionTitle>
              {produto.aproved ? (
                <div className="space-y-0.5">
                  {(approverEmail ?? produto.aproved_user) && (
                    <FieldRow
                      icon={<User className="size-4" />}
                      label={t('approval.approvedBy')}
                      value={approverEmail ?? produto.aproved_user}
                    />
                  )}
                  {produto.aproved_at && (
                    <FieldRow
                      icon={<Calendar className="size-4" />}
                      label={t('approval.approvedAt')}
                      value={<span className="text-xs">{formatDateTime(produto.aproved_at)}</span>}
                    />
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">{t('approval.notApproved')}</p>
              )}
            </div>

            <Separator />

            {/* ── HIERARQUIA ── */}
            <div>
              <SectionTitle>{t('sections.hierarchy')}</SectionTitle>
              {isPai ? (
                <div className="flex items-center gap-2">
                  <Badge variant="default">{t('hierarchy.pai')}</Badge>
                  <span className="text-muted-foreground text-sm">
                    Este produto é pai — define o grupo de filhos
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{t('hierarchy.filho')}</Badge>
                    <span className="text-muted-foreground text-sm">
                      {t('hierarchy.parentEan')}:{' '}
                      <span className="font-mono font-medium text-foreground">{produto.pai}</span>
                    </span>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/jornada-produto?q=${encodeURIComponent(produto.pai ?? '')}` as `/${string}`}>
                        <ExternalLink className="size-3" />
                        {t('hierarchy.viewParent')}
                      </Link>
                    </Button>
                  </div>
                  {paiProduto && (
                    <p className="text-muted-foreground text-xs">
                      Pai: <span className="text-foreground font-medium">{paiProduto.nome ?? paiProduto.ean}</span>
                      {paiProduto.campanha && ` · Campanha ${paiProduto.campanha}`}
                    </p>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* ── AGRUPAMENTOS ── */}
            <div>
              <SectionTitle>
                {t('sections.agrupamentos')}
                {agrupamentos.length > 0 && (
                  <span className="bg-muted ml-2 rounded-full px-1.5 py-0.5 text-xs font-normal normal-case">
                    {agrupamentos.length}
                  </span>
                )}
              </SectionTitle>

              {agrupamentos.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t('agrupamentos.noAgrupamentos')}</p>
              ) : (
                <div className="border-border divide-border divide-y overflow-hidden rounded-lg border text-sm">
                  <div className="bg-muted/50 grid grid-cols-4 px-3 py-1.5 text-xs font-medium">
                    <span>{t('agrupamentos.grupo')}</span>
                    <span>{t('agrupamentos.campanha')}</span>
                    <span>{t('agrupamentos.createdBy')}</span>
                    <span>{t('agrupamentos.createdAt')}</span>
                  </div>
                  {agrupamentos.map((ag) => (
                    <div key={ag.id} className="grid grid-cols-4 px-3 py-2">
                      <span className="truncate font-medium">{ag.grupo ?? '—'}</span>
                      <span>
                        {ag.campanha ? (
                          <Link
                            href={`/agrupamentos/${ag.campanha}` as `/${string}`}
                            className="hover:text-primary font-mono text-xs underline-offset-2 hover:underline"
                          >
                            {ag.campanha}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </span>
                      <span className="text-muted-foreground truncate text-xs">
                        {ag.user ? (userEmailMap.get(ag.user) ?? ag.user) : '—'}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {ag.userAt ? formatDateTime(ag.userAt) : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="disponibilidade" className="pt-4">
            <LojasTab lojas={lojas} />
          </TabsContent>

          <TabsContent value="logs" className="pt-4">
            <LogsTab logs={logs} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
