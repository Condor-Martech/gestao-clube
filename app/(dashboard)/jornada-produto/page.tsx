import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { requireModuleRead } from '@/lib/auth/guards'
import { pickString } from '@/lib/utils/search-params'
import { SearchForm } from './_components/search-form'
import { JornadaCard } from './_components/jornada-card'
import type { Produto, Agrupamento } from '@/types/entities'

interface Props {
  searchParams: Promise<{ q?: string | string[] }>
}

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
          ? await supabase.from('produto').select('*').in('ean', eans as string[])
          : { data: [] }

      allForDuplicateCheck = (dupData ?? []) as unknown as Produto[]

      // 3 — for each found product, fetch its agrupamentos
      const agrupamentosResults = await Promise.all(
        found.map(async (produto) => {
          let agResult: Agrupamento[] = []

          if (isPai(produto) && produto.ean) {
            const { data } = await supabase
              .from('Agrupamentos')
              .select('*')
              .eq('ean', produto.ean)
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
      const paiEans = [...new Set(
        found
          .filter((p) => !isPai(p) && p.pai)
          .map((p) => p.pai as string),
      )]

      const paiMap = new Map<string, Produto>()
      if (paiEans.length > 0) {
        const { data: paiData } = await supabase
          .from('produto')
          .select('*')
          .in('ean', paiEans)
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

      reports = found.map((produto, i) => ({
        produto,
        agrupamentos: agrupamentosResults[i] ?? [],
        paiProduto: !isPai(produto) && produto.pai ? (paiMap.get(produto.pai) ?? null) : null,
        approverEmail: produto.aproved_user
          ? (userEmailMap.get(produto.aproved_user) ?? produto.aproved_user)
          : null,
        userEmailMap,
      }))
    }
  }

  const eanCounts = allForDuplicateCheck.reduce<Record<string, Produto[]>>((acc, p) => {
    if (p.ean) {
      acc[p.ean] = acc[p.ean] ?? []
      acc[p.ean].push(p)
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
          {reports.map(({ produto, agrupamentos, paiProduto, approverEmail, userEmailMap }) => {
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
              />
            )
          })}
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
