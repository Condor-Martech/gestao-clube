import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { requireModuleRead } from '@/lib/auth/guards'
import { pickString } from '@/lib/utils/search-params'
import { SearchForm } from './_components/search-form'
import { JornadaCard } from './_components/jornada-card'
import type { Produto, Agrupamento, Loja, LogEntry } from '@/types/entities'

interface Props {
  searchParams: Promise<{ q?: string | string[] }>
}

interface PriceEntry {
  lst_mix_regiao?: number[] | null
  vlr_crm?: number | null
  vlr_preco_regular?: number | null
  vlr_preco_clube?: number | null
  vlr_margem?: number | null
  vlr_margem_crm?: number | null
  vlr_margem_clube?: number | null
}

export interface LojaPrice {
  vlr_crm: number | null
  vlr_preco_regular: number | null
  vlr_preco_clube: number | null
  vlr_margem: number | null
  vlr_margem_crm: number | null
  vlr_margem_clube: number | null
}

export type LojaDisponivel = Pick<
  Loja,
  'id' | 'title' | 'regiao' | 'cidade' | 'codLoja' | 'status'
> & { price: LojaPrice | null }

function isPai(produto: Produto): boolean {
  return !produto.pai || produto.pai === produto.ean
}

// Agrupamentos columns may come back as camelCase or lowercase depending on
// how the table was created. Normalise to match the Agrupamento interface.
function normalizeAgrupamento(raw: Record<string, unknown>): Agrupamento {
  return {
    ...raw,
    userAt: (raw.userAt ?? raw.userat ?? raw.user_at) as string | null,
    createdAt: (raw.createdAt ?? raw.createdat ?? raw.created_at) as string | null,
  } as unknown as Agrupamento
}

export default async function JornadaProdutoPage({ searchParams }: Props) {
  await requireModuleRead('ofertas')
  const sp = await searchParams
  const t = await getTranslations('jornadaProduto')
  const q = pickString(sp.q)?.trim() ?? null

  let reports: Array<{
    produto: Produto
    agrupamentos: Agrupamento[]
    paiProduto: Produto | null
    approverEmail: string | null
    userEmailMap: Map<string, string>
    lojas: LojaDisponivel[]
    logs: LogEntry[]
  }> = []

  let allForDuplicateCheck: Produto[] = []

  if (q) {
    const supabase = await createClient()

    // 1 — exact match by EAN or host
    const { data: exactData } = await supabase
      .from('produto')
      .select('*')
      .or(`ean.eq.${q},host.eq.${q}`)

    const found = (exactData ?? []) as unknown as Produto[]

    if (found.length > 0) {
      // 2 — detect duplicates: all products sharing same EAN (may span multiple campanhas)
      const eans = [...new Set(found.map((p) => p.ean).filter(Boolean))]

      const { data: dupData } =
        eans.length > 0
          ? await supabase
              .from('produto')
              .select('*')
              .in('ean', eans as string[])
          : { data: [] }

      allForDuplicateCheck = (dupData ?? []) as unknown as Produto[]

      // 3 — for each found product, fetch its agrupamentos
      const agrupamentosResults = await Promise.all(
        found.map(async (produto) => {
          let agResult: Agrupamento[] = []

          if (isPai(produto) && produto.ean) {
            const { data } = await supabase.from('Agrupamentos').select('*').eq('ean', produto.ean)
            agResult = (data ?? []).map((r) => normalizeAgrupamento(r as Record<string, unknown>))
          } else if (!isPai(produto) && produto.host) {
            const { data } = await supabase
              .from('Agrupamentos')
              .select('*')
              .ilike('grupo', `%${produto.host}%`)
            agResult = (data ?? []).map((r) => normalizeAgrupamento(r as Record<string, unknown>))
          }

          return agResult
        }),
      )

      // 4 — for FILHO products, fetch their parent produto
      const paiEans = [
        ...new Set(found.filter((p) => !isPai(p) && p.pai).map((p) => p.pai as string)),
      ]

      const paiMap = new Map<string, Produto>()
      if (paiEans.length > 0) {
        const { data: paiData } = await supabase.from('produto').select('*').in('ean', paiEans)
        for (const p of (paiData ?? []) as unknown as Produto[]) {
          if (p.ean) paiMap.set(p.ean, p)
        }
      }

      // 5 — batch-resolve all user identifiers (UUID or email) via users_system
      //     covers both aproved_user on produtos and user on agrupamentos
      const allAgrupamentos = agrupamentosResults.flat()
      const allUserValues = [
        ...new Set([
          ...found.filter((p) => p.aproved_user).map((p) => p.aproved_user as string),
          ...allAgrupamentos.filter((ag) => ag.user).map((ag) => ag.user as string),
        ]),
      ]
      const userEmailMap = new Map<string, string>()
      if (allUserValues.length > 0) {
        const orParts = allUserValues
          .map((v) => (v.includes('@') ? `email.eq.${v}` : `id.eq.${v}`))
          .join(',')
        const { data: usersData } = await supabase
          .from('users_system')
          .select('id, email')
          .or(orParts)
        for (const u of (usersData ?? []) as { id: string; email: string }[]) {
          userEmailMap.set(u.id, u.email)
          userEmailMap.set(u.email, u.email)
        }
      }

      // 6 — for each produto, derive the lojas that have it from price.lst_mix_regiao
      //     (despite the field name, the codes are loja identifiers — they match Lojas.codLoja)
      const lojasResults = await Promise.all(
        found.map(async (produto) => {
          const priceArr = (produto as unknown as { price: PriceEntry[] | null }).price ?? []

          // map each loja code to its price entry — the price belongs to the
          // mix group, not the produto, so different lojas may carry different prices
          const codLojaToPrice = new Map<string, PriceEntry>()
          for (const entry of priceArr) {
            for (const code of entry?.lst_mix_regiao ?? []) {
              if (code != null) codLojaToPrice.set(String(code), entry)
            }
          }

          if (codLojaToPrice.size === 0) return [] as LojaDisponivel[]

          const { data: lojasData } = await supabase
            .from('Lojas')
            .select('id, title, regiao, cidade, codLoja, status')
            .in('codLoja', [...codLojaToPrice.keys()])
            .eq('status', true)
            .order('regiao', { ascending: true })
            .order('title', { ascending: true })

          return ((lojasData ?? []) as unknown as Array<Omit<LojaDisponivel, 'price'>>).map(
            (loja) => {
              const entry = loja.codLoja != null ? codLojaToPrice.get(loja.codLoja) : undefined
              return {
                ...loja,
                price: entry
                  ? {
                      vlr_crm: entry.vlr_crm ?? null,
                      vlr_preco_regular: entry.vlr_preco_regular ?? null,
                      vlr_preco_clube: entry.vlr_preco_clube ?? null,
                      vlr_margem: entry.vlr_margem ?? null,
                      vlr_margem_crm: entry.vlr_margem_crm ?? null,
                      vlr_margem_clube: entry.vlr_margem_clube ?? null,
                    }
                  : null,
              }
            },
          )
        }),
      )

      // 7 — for each produto, fetch logs matching its UUID, campanha (cod or alias),
      //     or EAN (as agrupamento parent) via JSONB payload accessors
      const logsResults = await Promise.all(
        found.map(async (produto) => {
          const filters = [
            produto.id ? `payload->>produto_id.eq.${produto.id}` : null,
            produto.campanha ? `payload->>campanha.eq.${produto.campanha}` : null,
            produto.campanha ? `payload->>cod_campanha.eq.${produto.campanha}` : null,
            produto.ean ? `payload->>pai.eq.${produto.ean}` : null,
          ].filter((s): s is string => s !== null)

          if (filters.length === 0) return [] as LogEntry[]

          const { data: logsData } = await supabase
            .from('logs_with_users')
            .select('id, created_at, event_name, user, email, module, payload')
            .or(filters.join(','))
            .order('created_at', { ascending: false })
            .limit(200)

          return (logsData ?? []) as unknown as LogEntry[]
        }),
      )

      reports = found.map((produto, i) => ({
        produto,
        agrupamentos: agrupamentosResults[i] ?? [],
        paiProduto: !isPai(produto) && produto.pai ? (paiMap.get(produto.pai) ?? null) : null,
        approverEmail: produto.aproved_user
          ? (userEmailMap.get(produto.aproved_user) ?? produto.aproved_user)
          : null,
        userEmailMap,
        lojas: lojasResults[i] ?? [],
        logs: logsResults[i] ?? [],
      }))
    }
  }

  const eanCounts = allForDuplicateCheck.reduce<Record<string, Produto[]>>((acc, p) => {
    if (p.ean) {
      const list = acc[p.ean] ?? []
      acc[p.ean] = list
      list.push(p)
    }
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      <SearchForm />

      {q && reports.length === 0 && (
        <div className="border-border rounded-lg border p-8 text-center">
          <p className="text-muted-foreground text-sm">{t('noResults', { q })}</p>
        </div>
      )}

      {reports.length > 0 && (
        <div className="space-y-5">
          {reports.map(
            ({ produto, agrupamentos, paiProduto, approverEmail, userEmailMap, lojas, logs }) => {
              const duplicates = produto.ean ? (eanCounts[produto.ean] ?? []) : []
              const isDuplicate = duplicates.length > 1
              return (
                <JornadaCard
                  key={produto.id}
                  produto={produto}
                  isPai={isPai(produto)}
                  agrupamentos={agrupamentos}
                  paiProduto={paiProduto}
                  approverEmail={approverEmail}
                  userEmailMap={userEmailMap}
                  isDuplicate={isDuplicate}
                  allDuplicates={duplicates}
                  lojas={lojas}
                  logs={logs}
                />
              )
            },
          )}
        </div>
      )}

      {!q && (
        <div className="border-border bg-muted/30 flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Digite um EAN ou Host para investigar o histórico completo do produto
          </p>
        </div>
      )}
    </div>
  )
}
