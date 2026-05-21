import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { requireModuleRead } from '@/lib/auth/guards'
import type { Pipeline, Produto } from '@/types/entities'
import { PipelineEditor } from './_components/pipeline-editor'

// Max productos aprobados que se cargan al editor.
// Override del default de PostgREST (1000) — necesário para que el orden
// global del catálogo quede consistente al aplicar.
const PRODUCTOS_HARD_CAP = 50000
const SINGLETON_NAME = 'Regra Padrão'

export default async function OrdenarPage() {
  await requireModuleRead('ofertas')
  const t = await getTranslations('regrasOrdenacao')
  const supabase = await createClient()

  const pipeline = await getOrCreateSingleton(supabase)

  const PRODUTOS_COLUMNS =
    'id, ean, nome, descricao, unidade, img_internal, img_external, host, "order", campanha, aproved, aproved_user, aproved_at, pai, eletro, created_at, updated_at, mercadologico_web'

  const [{ data: produtosRow }, { data: campanhasRow }] = await Promise.all([
    supabase
      .from('Produtos')
      .select(PRODUTOS_COLUMNS)
      .eq('aproved', true)
      .order('order', { ascending: true, nullsFirst: false })
      .limit(PRODUCTOS_HARD_CAP),
    supabase.from('campanhas').select('cod_campanha, nom_campanha').order('cod_campanha'),
  ])

  // mercadologico_web é JSONB array em Produtos. Estrutura real:
  // [{ setor: { dsc_mercadologico, cod_mercadologico }, departamento: {...} }, ...]
  // Projetamos o primeiro item para campos escalares que o runner e a UI esperam.
  type MercNode = {
    cod_mercadologico?: number | null
    dsc_mercadologico?: string | null
    ind_nivel?: number | null
  } | null
  type ProdutoRow = Omit<Produto, 'departamento' | 'departamento_cod' | 'setor' | 'setor_cod'> & {
    mercadologico_web?: Array<{
      setor?: MercNode
      departamento?: MercNode
      grupoFamilia?: unknown
    }> | null
  }

  const produtosRaw: Produto[] = ((produtosRow ?? []) as unknown as ProdutoRow[]).map((row) => {
    const first = Array.isArray(row.mercadologico_web) ? row.mercadologico_web[0] : null
    return {
      ...row,
      departamento: first?.departamento?.dsc_mercadologico ?? null,
      departamento_cod: first?.departamento?.cod_mercadologico ?? null,
      setor: first?.setor?.dsc_mercadologico ?? null,
      setor_cod: first?.setor?.cod_mercadologico ?? null,
    } as Produto
  })

  // Agrupamos por EAN: o mesmo produto pode aparecer em N campanhas.
  // Mantemos a primeira fila como representante e construímos um mapa
  // ean → campanhas[] para mostrar no badge e usar no boost.
  const eanToCampanhasMap: Record<string, string[]> = {}
  const eanToFirst = new Map<string, Produto>()
  const produtosSemEan: Produto[] = []
  const departamentosSet = new Set<string>()
  const setoresSet = new Set<string>()
  for (const p of produtosRaw) {
    if (p.departamento) departamentosSet.add(p.departamento)
    if (p.setor) setoresSet.add(p.setor)
    if (!p.ean) {
      produtosSemEan.push(p)
      continue
    }
    if (p.campanha) {
      const arr = eanToCampanhasMap[p.ean] ?? []
      if (!arr.includes(p.campanha)) arr.push(p.campanha)
      eanToCampanhasMap[p.ean] = arr
    }
    if (!eanToFirst.has(p.ean)) {
      eanToFirst.set(p.ean, p)
    }
  }
  const produtos = [...eanToFirst.values(), ...produtosSemEan]
  const departamentos = [...departamentosSet].sort()
  const setores = [...setoresSet].sort()

  const campanhas = (campanhasRow ?? []).map((c) => ({
    value: c.cod_campanha as string,
    label: (c.nom_campanha as string | null) ?? (c.cod_campanha as string),
  }))

  return (
    <div className="space-y-4">
      <header className="border-border bg-card flex items-center justify-between gap-3 rounded-lg border p-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        </div>
      </header>

      <PipelineEditor
        pipeline={pipeline}
        produtos={produtos}
        campanhas={campanhas}
        departamentos={departamentos}
        setores={setores}
        eanToCampanhas={eanToCampanhasMap}
      />
    </div>
  )
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

async function getOrCreateSingleton(supabase: SupabaseClient): Promise<Pipeline> {
  const { data: existing } = await supabase
    .from('pipelines')
    .select('id, name, owner_id, nodes, edges, created_at, updated_at')
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (existing) return existing as unknown as Pipeline

  const { data: claimsData } = await supabase.auth.getClaims()
  const ownerId = claimsData?.claims?.sub as string | undefined
  if (!ownerId) {
    throw new Error('Sessão inválida — faça login novamente')
  }

  const { data: created, error } = await supabase
    .from('pipelines')
    .insert({
      name: SINGLETON_NAME,
      owner_id: ownerId,
      nodes: [],
      edges: [],
    })
    .select('id, name, owner_id, nodes, edges, created_at, updated_at')
    .single()

  if (error || !created) {
    console.error('[ordenar] failed to create singleton pipeline', {
      error,
      ownerId,
    })
    throw new Error(error?.message || error?.details || 'Falha ao inicializar pipeline padrão')
  }

  return created as unknown as Pipeline
}
