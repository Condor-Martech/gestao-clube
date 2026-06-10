'use client'

import { useMemo, useState } from 'react'
import {
  Search,
  ChevronRight,
  LayoutDashboard,
  Megaphone,
  Package,
  Route,
  Workflow,
  Store,
  Layers,
  Image as ImageIcon,
  Users,
  ScrollText,
  Clock,
  Sparkles,
  ArrowUpRight,
  Shield,
  KeyRound,
  type LucideIcon,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Area = 'visao' | 'comercial' | 'inteligencia' | 'operacoes' | 'sistema'

interface ModuleDoc {
  num: string
  area: Area
  slug: string
  title: string
  icon: LucideIcon
  blurb: string
  steps: string[]
  permissions: string
  tips?: string[]
  badge?: 'novo' | 'atualizado'
  updatedAt: string
  entryPath?: string
}

interface FaqItem {
  q: string
  a: string
}

const AREAS: { id: Area | 'todos'; label: string }[] = [
  { id: 'todos', label: 'Tudo' },
  { id: 'visao', label: 'Visão Geral' },
  { id: 'comercial', label: 'Comercial' },
  { id: 'inteligencia', label: 'Inteligência' },
  { id: 'operacoes', label: 'Operações' },
  { id: 'sistema', label: 'Sistema' },
]

const MODULES: ModuleDoc[] = [
  {
    num: '01',
    area: 'visao',
    slug: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    blurb:
      'Painel inicial com KPIs do projeto e os últimos eventos do sistema. É o ponto de partida diário.',
    steps: [
      'Visualize a contagem de Agrupamentos, Produtos aprovados e Campanhas sincronizadas em cards de KPI.',
      'Consulte os 10 logs mais recentes na tabela inferior — clique em qualquer linha para abrir o evento completo.',
      'Atalhos rápidos no topo levam para Campanhas, Produtos e Logs.',
    ],
    permissions: 'Todos os papéis (admin, manager, user).',
    tips: [
      'KPIs são lidos de views agregadas — atualize a página para refletir mudanças recentes.',
    ],
    updatedAt: '2026-04-27',
    entryPath: '/dashboard',
  },
  {
    num: '02',
    area: 'comercial',
    slug: 'campanhas',
    title: 'Campanhas',
    icon: Megaphone,
    blurb:
      'Cadastro e gestão de campanhas comerciais. Cada campanha agrupa produtos e dispara para o app dos clientes.',
    steps: [
      'Use as abas “Com produto no APP” / “Sem produto no APP” para filtrar pelo estado de sincronização.',
      'Clique em Nova campanha para criar — informe título, datas e tipo.',
      'Em cada linha, os ícones inline executam copy / layers / list / download / sync. O dropdown traz editar e excluir.',
      'A coluna NOME mostra o título empilhado com a data de última atualização.',
    ],
    permissions: 'admin e manager.',
    tips: [
      'Sincronizar dispara o envio para o APP — confira o status na coluna STATUS antes de comunicar a equipe.',
    ],
    badge: 'atualizado',
    updatedAt: '2026-04-27',
    entryPath: '/campanhas',
  },
  {
    num: '03',
    area: 'comercial',
    slug: 'produtos',
    title: 'Produtos',
    icon: Package,
    blurb: 'Catálogo navegável e editável. Lista global + lista por campanha em /produtos/[code].',
    steps: [
      'Alterne entre visão lista (datatable inline editável) e grid (cards com imagem).',
      'Edite nome, descrição, unidade e ordem clicando direto na célula. Enter salva, Escape cancela.',
      'Use ?search= para buscar por nome, EAN ou mercadológico web. ?approved=yes|no filtra aprovação. ?sort= ordena.',
      'Aprove ou reprove pelo botão na linha; o ícone de sync envia ao APP.',
    ],
    permissions: 'admin e manager.',
    tips: [
      'A view canônica de leitura é produtos_pai — já filtra pai = ean e order não nulo no servidor.',
      'mercadologico_web aparece no grid card e participa da busca OR.',
    ],
    badge: 'atualizado',
    updatedAt: '2026-04-27',
    entryPath: '/produtos',
  },
  {
    num: '04',
    area: 'comercial',
    slug: 'jornada-produto',
    title: 'Jornada do Produto',
    icon: Route,
    blurb:
      'Linha do tempo de cada produto: criação, aprovações, alterações e sincronizações com o APP.',
    steps: [
      'Acesse a partir do detalhe de um produto ou direto pela navegação.',
      'Eventos vêm da view de logs filtrada pelo EAN — ordem cronológica decrescente.',
    ],
    permissions: 'admin e manager.',
    updatedAt: '2026-04-27',
    entryPath: '/jornada-produto',
  },
  {
    num: '05',
    area: 'comercial',
    slug: 'agrupamentos',
    title: 'Agrupamentos',
    icon: Layers,
    blurb:
      'Subgrupos dentro de uma campanha. Renderiza grid de cards com produtos aninhados, sem drag-and-drop.',
    steps: [
      'Abra /agrupamentos/[code] para ver os agrupamentos da campanha.',
      'Cada card escala 1→2→3→4→6 colunas conforme a largura da tela.',
      'Toggle “Ver mais” em cada card expande os produtos do agrupamento.',
      'Crie novos via /agrupamentos/new/[code].',
    ],
    permissions: 'admin e manager.',
    tips: [
      'O dnd-kit foi removido — a ordenação agora é gerida pela view produtos_no_agrupamento.',
    ],
    badge: 'atualizado',
    updatedAt: '2026-04-27',
  },
  {
    num: '06',
    area: 'inteligencia',
    slug: 'regras-ordenacao',
    title: 'Regras de Ordenação',
    icon: Workflow,
    blurb:
      'Regras que determinam como os produtos aparecem ordenados no APP — combinação de campos e prioridade.',
    steps: [
      'Acesse via Inteligência → Regras de Ordenação.',
      'Crie / edite regras e aplique o sort em /produtos via ?sort=campo:dir.',
    ],
    permissions: 'admin e manager.',
    updatedAt: '2026-04-27',
    entryPath: '/produtos/ordenar',
  },
  {
    num: '07',
    area: 'operacoes',
    slug: 'lojas',
    title: 'Lojas',
    icon: Store,
    blurb:
      'Cadastro de lojas físicas. Datatable inline editável: nome (title), região, cidade, telefone, código e status.',
    steps: [
      'Clique em uma célula para editar; Enter / blur salva, Escape cancela.',
      'Status é um badge clicável — alterna boolean com update otimista.',
      'Use o modal “Nova loja” no topo para criar — título obrigatório, demais opcionais.',
    ],
    permissions: 'admin, manager e user (leitura).',
    updatedAt: '2026-04-27',
    entryPath: '/lojas',
  },
  {
    num: '08',
    area: 'operacoes',
    slug: 'ofertas-regiao',
    title: 'Ofertas por Região',
    icon: ImageIcon,
    blurb: 'Edição do vídeo e dos três carrosséis (cor, título, imagens) por região.',
    steps: [
      'Cada região tem três carrosséis com cor de fundo, título e lista de URLs.',
      'Imagens são URLs externas — sem upload via painel.',
    ],
    permissions: 'operacionais.',
    updatedAt: '2026-06-10',
    entryPath: '/ofertas-regiao',
  },
  {
    num: '09',
    area: 'sistema',
    slug: 'users',
    title: 'Users',
    icon: Users,
    blurb: 'Convite e gestão de papéis. Usa a admin API do Supabase para invite por email.',
    steps: [
      'Convide um usuário pelo email — o Supabase envia o magic link de cadastro.',
      'Edite role e status na tabela. Status inativo bloqueia login.',
    ],
    permissions: 'admin.',
    updatedAt: '2026-04-27',
    entryPath: '/users',
  },
  {
    num: '10',
    area: 'sistema',
    slug: 'logs',
    title: 'Logs',
    icon: ScrollText,
    blurb: 'Auditoria do sistema. View logs_with_users já joina logs.user → users.email.',
    steps: [
      'Filtre por módulo, evento e período. JSON do payload aparece com highlight.',
      'Exporte um log em CSV ou em PNG de evidência (next/og + hash SHA-256).',
    ],
    permissions: 'admin.',
    tips: [
      'A evidência PNG inclui módulo, evento, usuário e timestamp UTC — serve como prova de auditoria.',
    ],
    badge: 'atualizado',
    updatedAt: '2026-04-27',
    entryPath: '/logs',
  },
  {
    num: '11',
    area: 'sistema',
    slug: 'history',
    title: 'Histórico',
    icon: Clock,
    blurb:
      'Linha do tempo geral de mudanças no sistema (não confundir com Logs, que é por evento).',
    steps: [
      'Visualize alterações agrupadas por dia.',
      'Clique em um item para ver o diff quando aplicável.',
    ],
    permissions: 'Todos os papéis.',
    updatedAt: '2026-04-27',
    entryPath: '/history',
  },
]

const FAQ: FaqItem[] = [
  {
    q: 'Como aprovo um produto e envio ao APP?',
    a: 'Em /produtos, abra a campanha em /produtos/[code], aprove o item pelo botão na linha (ou em batch via filtro) e clique no ícone de sync para sincronizar com o APP.',
  },
  {
    q: 'Não vejo a aba Banner / Users / Logs — por quê?',
    a: 'Essas pantallas são restritas. Banner é admin; Users e Logs também. O role é lido de public.profiles.role no layout do dashboard, não do JWT.',
  },
  {
    q: 'O que diferencia Logs de Histórico?',
    a: 'Logs é o registro técnico evento-a-evento (com payload, módulo, exportação CSV/PNG). Histórico é a visão consolidada por dia para acompanhamento operacional.',
  },
  {
    q: 'Por que produtos_pai e não a tabela produtos?',
    a: 'A view produtos_pai já filtra pai = ean e order não nulo do lado do servidor, evitando o filtro client-side. Use sempre essa view para leituras de catálogo.',
  },
  {
    q: 'Posso editar várias células ao mesmo tempo?',
    a: 'A edição é por célula — Enter ou blur salva uma de cada vez. Escape cancela. O update é otimista, então a UI reflete o valor antes da confirmação do servidor.',
  },
]

const WHATS_NEW: { date: string; title: string; tag: string }[] = [
  {
    date: '07.05.26',
    title: 'Central de Ajuda do Sistema substitui o iframe Google Docs.',
    tag: 'Documentação',
  },
  {
    date: '27.04.26',
    title: 'Logs ganha exportação PNG com hash SHA-256 via next/og.',
    tag: 'Auditoria',
  },
  {
    date: '27.04.26',
    title: 'Lojas migra para datatable inline editável (mesmo padrão de Produtos).',
    tag: 'UX',
  },
  {
    date: '27.04.26',
    title: 'Agrupamentos reescrita: grid de cards, sem dnd-kit, view produtos_no_agrupamento.',
    tag: 'Arquitetura',
  },
  {
    date: '27.04.26',
    title: 'Dashboard nativo substitui o embed do Looker Studio.',
    tag: 'Dashboard',
  },
]

export function SystemDocsHub() {
  const [query, setQuery] = useState('')
  const [activeArea, setActiveArea] = useState<Area | 'todos'>('todos')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return MODULES.filter((m) => {
      if (activeArea !== 'todos' && m.area !== activeArea) return false
      if (!q) return true
      return (
        m.title.toLowerCase().includes(q) ||
        m.blurb.toLowerCase().includes(q) ||
        m.slug.includes(q) ||
        m.steps.some((s) => s.toLowerCase().includes(q))
      )
    })
  }, [query, activeArea])

  const counts = useMemo(() => {
    const map = new Map<Area | 'todos', number>()
    map.set('todos', MODULES.length)
    for (const m of MODULES) map.set(m.area, (map.get(m.area) ?? 0) + 1)
    return map
  }, [])

  return (
    <div className="-mx-4 md:-mx-6">
      <article className="mx-auto max-w-6xl px-4 pb-24 md:px-8">
        {/* HERO ─────────────────────────────────────────────── */}
        <header className="border-foreground/90 border-b pt-6 pb-10 md:pt-10">
          <div className="text-muted-foreground flex flex-wrap items-center gap-3 font-mono text-[11px] tracking-[0.18em] uppercase">
            <span>Vol. 01</span>
            <span className="bg-foreground/30 inline-block h-px w-6" />
            <span>Manual interno</span>
            <span className="bg-foreground/30 inline-block h-px w-6" />
            <span>pt-BR</span>
          </div>

          <h1 className="mt-6 font-sans text-5xl leading-[0.95] font-semibold tracking-tighter md:text-7xl lg:text-[5.5rem]">
            Central de Ajuda
            <span className="text-muted-foreground/70 block italic">do Sistema.</span>
          </h1>

          <div className="mt-8 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <p className="text-muted-foreground max-w-xl text-base leading-relaxed md:text-lg">
              Documentação operacional de cada módulo do back-office. Construído como referência
              diária — não como brochura. Tudo vive aqui, em HTML, sem iframes externos.
            </p>
            <dl className="text-muted-foreground grid grid-cols-3 gap-4 font-mono text-[11px] tracking-[0.14em] uppercase md:text-right">
              <div>
                <dt className="text-foreground/60">Versão</dt>
                <dd className="text-foreground mt-1 text-sm tracking-normal normal-case">1.0</dd>
              </div>
              <div>
                <dt className="text-foreground/60">Atualizado</dt>
                <dd className="text-foreground mt-1 text-sm tracking-normal normal-case">
                  07.05.26
                </dd>
              </div>
              <div>
                <dt className="text-foreground/60">Módulos</dt>
                <dd className="text-foreground mt-1 text-sm tracking-normal normal-case">
                  {MODULES.length}
                </dd>
              </div>
            </dl>
          </div>

          {/* Search */}
          <div className="bg-card focus-within:ring-ring/40 mt-10 flex items-center gap-3 rounded-md border px-4 py-3 shadow-sm focus-within:ring-2">
            <Search className="text-muted-foreground size-4 shrink-0" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar módulo, ação ou termo técnico…"
              className="h-auto border-0 bg-transparent p-0 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <kbd className="text-muted-foreground bg-muted/40 hidden items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline-flex">
              <KeyRound className="size-3" /> /
            </kbd>
          </div>

          {/* Filters */}
          <nav aria-label="Filtrar por área" className="mt-5 flex flex-wrap gap-1.5">
            {AREAS.map((a) => {
              const active = activeArea === a.id
              const count = counts.get(a.id) ?? 0
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setActiveArea(a.id)}
                  className={cn(
                    'group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    active
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-card text-foreground/70 hover:text-foreground hover:bg-muted/50',
                  )}
                >
                  <span>{a.label}</span>
                  <span
                    className={cn(
                      'font-mono text-[10px] tabular-nums',
                      active ? 'text-background/70' : 'text-muted-foreground',
                    )}
                  >
                    {count.toString().padStart(2, '0')}
                  </span>
                </button>
              )
            })}
          </nav>
        </header>

        {/* INDEX ─────────────────────────────────────────────── */}
        <section className="grid gap-0 pt-2 md:grid-cols-12">
          <aside className="text-muted-foreground hidden border-r py-10 pr-6 font-mono text-[11px] tracking-[0.14em] uppercase md:col-span-3 md:block">
            <div className="sticky top-6">
              <p className="text-foreground/60 mb-4">Índice</p>
              <ol className="space-y-2.5">
                {filtered.map((m) => (
                  <li key={m.slug}>
                    <a
                      href={`#m-${m.slug}`}
                      className="hover:text-foreground flex items-baseline gap-3 tracking-normal normal-case"
                    >
                      <span className="text-foreground/40 tabular-nums">{m.num}</span>
                      <span>{m.title}</span>
                    </a>
                  </li>
                ))}
                {filtered.length === 0 && (
                  <li className="text-muted-foreground/60 tracking-normal normal-case">
                    Nada encontrado.
                  </li>
                )}
              </ol>
            </div>
          </aside>

          <div className="md:col-span-9 md:pl-10">
            {filtered.length === 0 ? (
              <div className="border-foreground/10 my-16 border-y py-20 text-center">
                <p className="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase">
                  Sem resultados
                </p>
                <p className="mt-3 text-lg">
                  Nenhum módulo casa com <span className="font-mono">“{query}”</span>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setActiveArea('todos')
                  }}
                  className="text-foreground mt-4 inline-flex items-center gap-1 text-sm underline underline-offset-4 hover:no-underline"
                >
                  Limpar filtros
                  <ArrowUpRight className="size-3.5" />
                </button>
              </div>
            ) : (
              <ol className="divide-y">
                {filtered.map((m) => (
                  <ModuleEntry key={m.slug} mod={m} />
                ))}
              </ol>
            )}
          </div>
        </section>

        {/* WHATS NEW ─────────────────────────────────────────── */}
        <section className="mt-24 border-t pt-12">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase">
                § Diário de bordo
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Novidades</h2>
            </div>
            <Sparkles className="text-muted-foreground/40 size-5" />
          </div>
          <ol className="divide-y">
            {WHATS_NEW.map((n, i) => (
              <li
                key={i}
                className="flex flex-col gap-1.5 py-4 md:flex-row md:items-baseline md:gap-6"
              >
                <span className="text-muted-foreground w-20 shrink-0 font-mono text-xs tabular-nums">
                  {n.date}
                </span>
                <span className="text-foreground/90 flex-1 text-sm leading-relaxed">{n.title}</span>
                <Badge
                  variant="outline"
                  className="w-fit font-mono text-[10px] tracking-wider uppercase"
                >
                  {n.tag}
                </Badge>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ ───────────────────────────────────────────────── */}
        <section className="mt-24 border-t pt-12">
          <p className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase">
            § Perguntas frequentes
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Dúvidas comuns.
          </h2>

          <ol className="mt-8 divide-y border-y">
            {FAQ.map((item, i) => (
              <li key={i}>
                <details className="group [&>summary]:list-none">
                  <summary className="hover:bg-muted/30 flex cursor-pointer items-baseline gap-4 px-1 py-5 transition-colors">
                    <span className="text-muted-foreground w-7 shrink-0 font-mono text-xs tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1 text-base font-medium md:text-lg">{item.q}</span>
                    <ChevronRight className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="text-muted-foreground pr-8 pb-6 pl-11 text-sm leading-relaxed">
                    {item.a}
                  </p>
                </details>
              </li>
            ))}
          </ol>
        </section>

        {/* COLOPHON ─────────────────────────────────────────── */}
        <footer className="mt-24 border-t pt-10">
          <div className="grid gap-6 md:grid-cols-3 md:gap-10">
            <div>
              <p className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase">
                Cólofon
              </p>
              <p className="mt-3 text-sm leading-relaxed">
                Documento mantido pela equipe de plataforma. Editorial em Montserrat; numeração em
                monospace.
              </p>
            </div>
            <div>
              <p className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase">
                Erratas
              </p>
              <p className="mt-3 text-sm leading-relaxed">
                Encontrou algo desatualizado? Abra um log via{' '}
                <a
                  href="/logs"
                  className="text-foreground underline underline-offset-4 hover:no-underline"
                >
                  /logs
                </a>{' '}
                ou avise a equipe responsável pela manutenção.
              </p>
            </div>
            <div>
              <p className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase">
                Próxima edição
              </p>
              <p className="mt-3 text-sm leading-relaxed">
                Inclusão de capítulo sobre Instance / WhatsApp e automações de Banner.
              </p>
            </div>
          </div>
          <p className="text-muted-foreground/60 mt-10 font-mono text-[10px] tracking-[0.18em] uppercase">
            Fim do volume — {MODULES.length} capítulos · Versão 1.0
          </p>
        </footer>
      </article>
    </div>
  )
}

function ModuleEntry({ mod }: { mod: ModuleDoc }) {
  const Icon = mod.icon
  return (
    <li id={`m-${mod.slug}`} className="scroll-mt-6">
      <details className="group [&>summary]:list-none">
        <summary className="hover:bg-muted/30 flex cursor-pointer items-start gap-5 px-1 py-7 transition-colors md:gap-8 md:py-9">
          <span className="text-muted-foreground/40 w-14 shrink-0 font-mono text-4xl leading-none font-medium tabular-nums md:w-20 md:text-6xl">
            {mod.num}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground font-mono text-[10px] tracking-[0.18em] uppercase">
                {areaLabel(mod.area)}
              </span>
              {mod.badge && (
                <Badge
                  variant="outline"
                  className={cn(
                    'font-mono text-[10px] tracking-wider uppercase',
                    mod.badge === 'novo' && 'border-foreground bg-foreground text-background',
                  )}
                >
                  {mod.badge}
                </Badge>
              )}
            </div>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{mod.title}</h3>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed md:text-base">
              {mod.blurb}
            </p>
          </div>
          <div className="hidden flex-col items-end gap-2 md:flex">
            <Icon
              className="text-muted-foreground/50 group-hover:text-foreground size-6 transition-colors"
              aria-hidden
            />
            <ChevronRight className="text-muted-foreground size-4 transition-transform group-open:rotate-90" />
          </div>
          <ChevronRight className="text-muted-foreground size-5 shrink-0 transition-transform group-open:rotate-90 md:hidden" />
        </summary>

        <div className="grid gap-8 pr-2 pb-10 pl-[4.75rem] md:grid-cols-[1fr_auto] md:gap-12 md:pl-[7rem]">
          <div className="space-y-6">
            <section>
              <p className="text-muted-foreground font-mono text-[10px] tracking-[0.18em] uppercase">
                Como usar
              </p>
              <ol className="mt-3 space-y-2.5 text-sm leading-relaxed">
                {mod.steps.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-muted-foreground/60 w-5 shrink-0 font-mono text-xs tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-foreground/90">{s}</span>
                  </li>
                ))}
              </ol>
            </section>

            {mod.tips && mod.tips.length > 0 && (
              <section>
                <p className="text-muted-foreground font-mono text-[10px] tracking-[0.18em] uppercase">
                  Notas técnicas
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed">
                  {mod.tips.map((t, i) => (
                    <li
                      key={i}
                      className="border-foreground/30 text-muted-foreground border-l-2 pl-3 italic"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="bg-card flex w-full flex-col gap-5 rounded-md border p-5 md:w-64">
            <div>
              <p className="text-muted-foreground flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] uppercase">
                <Shield className="size-3" /> Permissões
              </p>
              <p className="mt-2 text-sm leading-relaxed">{mod.permissions}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-mono text-[10px] tracking-[0.18em] uppercase">
                Slug
              </p>
              <p className="mt-2 font-mono text-sm">/{mod.slug}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-mono text-[10px] tracking-[0.18em] uppercase">
                Atualizado
              </p>
              <p className="mt-2 font-mono text-sm tabular-nums">{mod.updatedAt}</p>
            </div>
            {mod.entryPath ? (
              <a
                href={mod.entryPath}
                className="bg-foreground text-background mt-2 inline-flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              >
                Abrir módulo
                <ArrowUpRight className="size-4" />
              </a>
            ) : (
              <p className="text-muted-foreground mt-2 rounded-md border border-dashed px-3 py-2 text-xs leading-relaxed">
                Acessível a partir de <span className="font-mono">/campanhas</span>.
              </p>
            )}
          </aside>
        </div>
      </details>
    </li>
  )
}

function areaLabel(a: Area): string {
  switch (a) {
    case 'visao':
      return 'Visão Geral'
    case 'comercial':
      return 'Comercial'
    case 'inteligencia':
      return 'Inteligência'
    case 'operacoes':
      return 'Operações'
    case 'sistema':
      return 'Sistema'
  }
}
