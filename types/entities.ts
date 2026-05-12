/**
 * Temporary entity types for Supabase tables.
 *
 * These mirror the schema documented in docs/05_DATA_MODEL.md and the legacy
 * Flutter structs. Once `npm run db:types` is wired up against the real
 * Supabase project, these can be replaced by aliases against the generated
 * `Database` type:
 *
 *   export type Loja = Database['public']['Tables']['Lojas']['Row']
 *
 * Until then, RSC pages use these types and cast Supabase's `unknown[]`
 * payload to the right shape.
 */


export type CampanhaStatus = 'Ativa' | 'Inativa'

export interface AgrupamentoItem {
  ean: string
  nome?: string | null
  order?: number | null
}

export interface Agrupamento {
  id: string
  grupo: string | null
  ean: string | null
  host: string | null
  order: number | null
  user: string | null
  userAt: string | null
  campanha: string | null
  itens: AgrupamentoItem[] | null
  createdAt: string | null
}

export interface Campanha {
  id: number
  cod_campanha: string
  nom_campanha: string | null
  dsc_situacao: CampanhaStatus | string | null
  dta_vigencia_inicio: string | null
  dta_vigencia_fim: string | null
  cod_tipo_campanha: number | null
  dsc_tipo_campanha: string | null
  qtd_produtos: number | null
  process: boolean | null
  created_at: string | null
  updated_at: string | null
}

/**
 * Mirrors the `produtos_pai` view (parent products, with mercadologico_web
 * already projected as departamento / setor columns). The view filters
 * `p.pai = p.ean` server-side so client code reads "parents only" rows.
 *
 * Mutations target the underlying `produto` table — same column names
 * except the view's projected fields (departamento*, setor*) are read-only.
 */
export interface Produto {
  id: string
  ean: string | null
  nome: string | null
  descricao: string | null
  unidade: string | null
  img_internal: string | null
  img_external: string | null
  host: string | null
  order: number | null
  campanha: string | null
  aproved: boolean | null
  aproved_user: string | null
  aproved_at: string | null
  pai: string | null
  eletro: boolean | null
  departamento: string | null
  departamento_cod: number | null
  setor: string | null
  setor_cod: number | null
  created_at: string | null
  updated_at: string | null
}

/**
 * Mirrors the `produtos_no_agrupamento` view — products joined with their
 * agrupamento by EAN. Used to list products that belong to any group within
 * a campanha.
 */
export interface ProdutoNoAgrupamento {
  id: string
  ean: string | null
  nome: string | null
  descricao: string | null
  unidade: string | null
  img_internal: string | null
  img_external: string | null
  host: string | null
  order: number | null
  campanha: string | null
  aproved: boolean | null
  aproved_user: string | null
  aproved_at: string | null
  created_at: string | null
  updated_at: string | null
  pai: string | null
  grupo: string | null
  agrupamento_order: number | null
  agrupamento_host: string | null
}

export interface Loja {
  id: string
  title: string | null
  content: string | null
  regiao: string | null
  cidade: string | null
  telefone: string | null
  latitude: number | null
  longitude: number | null
  setores: string | null
  servicos: string | null
  placeid: string | null
  horarios: string | null
  codLoja: string | null
  status: boolean | null
}

export interface LogEntry {
  id: string
  created_at: string
  event_name: string | null
  user: string | null
  email: string | null
  module: string | null
  payload: unknown
}

export interface AuditActivation {
  id: string
  user_id: string | null
  product_id: string | null
  campaign_code: string | null
  action: string | null
  timestamp: string
  status: 'success' | 'failed' | string | null
}

export type UserRole = 'admin' | 'manager' | 'user'

import type { ModuleRoles } from '@/lib/rbac'

export interface UserSystem {
  id: string
  email: string
  role: UserRole | string | null
  profileRole: string | null
  phone: string | null
  isSuperAdmin: boolean | null
  status: boolean | null
  module_roles: ModuleRoles
  created_at: string | null
  last_login: string | null
}

/**
 * Visual sort pipeline (n8n-style). Each row holds the canvas of nodes
 * + edges that the user composes in `/produtos/ordenar/[id]`. The terminal
 * `apply` node calls `apply_pipeline_order(eans)` to rewrite produto.order
 * for the filtered subset.
 */
export type PipelineNodeType =
  | 'source'
  | 'boostCampanha'
  | 'filterMercadologico'
  | 'sortAuto'
  | 'sortManual'
  | 'apply'

export interface PipelineNodeData {
  campanhaPattern?: string
  departamentos?: string[]
  setores?: string[]
  field?: 'nome' | 'ean' | 'updated_at' | 'order'
  dir?: 'asc' | 'desc'
  orderedEans?: string[]
}

export interface PipelineNode {
  id: string
  type: PipelineNodeType
  position: { x: number; y: number }
  data: PipelineNodeData
}

export interface PipelineEdge {
  id: string
  source: string
  target: string
}

export interface Pipeline {
  id: string
  name: string
  owner_id: string
  nodes: PipelineNode[]
  edges: PipelineEdge[]
  created_at: string
  updated_at: string
}

export interface Oferta {
  id: string
  title: string | null
  slug: string | null
  regiao: string | null
  video: string | null
  carrosel: string[] | null
  carrosel2: string[] | null
  carrosel3: string[] | null
  createdAt: string | null
}

// ──────────────────────────────────────────────────────────────────
// Strapi-backed entities (banner-super-app, numero-da-sorte)
// These are the FLATTENED domain shapes consumed by RSC pages and
// client components. Strapi response envelopes (v4 attributes / v5 flat)
// are normalized via lib/strapi/mappers.ts.
// ──────────────────────────────────────────────────────────────────

import type { BannerSuperAppPosition } from '@/lib/validators/banner-super-app'

export interface BannerSuperApp {
  id: number
  name: string | null
  slug: string
  url: string | null
  position: BannerSuperAppPosition
  image: { url: string; alt?: string }
  order: number
  /** ISO timestamp when published; null = draft */
  publishedAt: string | null
}

export interface NumeroDaSorte {
  id: number
  titulo: string
  numeroCampanha: number
  /** YYYY-MM-DD (Strapi date type, timezone-naive) */
  startDate: string
  endDate: string
  banner: { url: string }
  bannerSmall: { url: string } | null
  regulamento: { url: string }
  /** ISO timestamp when published; null = draft */
  publishedAt: string | null
}

/**
 * Scheduled action from `strapi-plugin-publisher` (v1.x).
 * Auto-fires at `executeAt` and either publishes or unpublishes the entry
 * identified by `(entitySlug, entityId)`.
 */
export interface PublisherAction {
  id: number
  /** ISO 8601 UTC timestamp when the action fires */
  executeAt: string
  mode: 'publish' | 'unpublish'
  entityId: number
  /** e.g. 'api::numero-da-sorte.numero-da-sorte' */
  entitySlug: string
}

/** Pre-aggregated schedule for a single entry — at most one publish + one unpublish */
export interface EntrySchedule {
  publishAt?: string
  unpublishAt?: string
}
