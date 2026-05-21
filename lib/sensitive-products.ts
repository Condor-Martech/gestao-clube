import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * "Produto sensível" — itens essenciais da cesta básica (leite, óleo, etc.)
 * que o negócio quer monitorar quando entram em campanhas.
 *
 * Esta é apenas a lista PADRÃO (seed). Em runtime, as keywords vêm da tabela
 * `alertas_config`, editáveis na tela /configuracoes — ver lib/alertas/config.ts.
 *
 * Detecção: a PRIMEIRA PALAVRA do `produto.nome` precisa SER uma keyword
 * (case- e accent-insensitive). Comparar a palavra inteira — e não substring
 * — evita falsos positivos como "Cafeteira" (eletro) ou "Doce de Leite"
 * (sobremesa), que apenas contêm a keyword.
 */
export const DEFAULT_SENSITIVE_KEYWORDS = [
  'leite',
  'óleo',
  'azeite',
  'açúcar',
  'arroz',
  'feijão',
  'café',
  'farinha',
  'manteiga',
  'margarina',
  'macarrão',
] as const

/**
 * Marcas diacríticas combinantes (U+0300–U+036F). Construído via fromCharCode
 * para o fonte ficar em ASCII puro — sem caracteres combinantes invisíveis.
 */
const DIACRITIC_MARKS = new RegExp(
  `[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`,
  'g',
)

/** Lowercase + remove diacríticos, para que "ÓLEO" e "oleo" comparem iguais. */
export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(DIACRITIC_MARKS, '').toLowerCase().trim()
}

/**
 * True quando a PRIMEIRA palavra do nome é exatamente uma das keywords.
 *
 *  - "Óleo de Soja Coamo" → "oleo"      → sensível ✅
 *  - "Cafeteira Cadence"  → "cafeteira" → ≠ "cafe" ❌
 *  - "Doce de Leite"      → "doce"      → não é keyword ❌
 */
export function isSensitiveName(
  nome: string | null | undefined,
  keywords: readonly string[],
): boolean {
  if (!nome) return false
  const firstWord = normalizeText(nome).match(/[a-z]+/)?.[0] ?? ''
  if (!firstWord) return false
  return keywords.some((kw) => normalizeText(kw) === firstWord)
}

/**
 * Filtro `.or()` do PostgREST: nomes que COMEÇAM com a keyword (`ilike.kw*`).
 * Emite a forma acentuada E a sem acento de cada keyword, casando com ou sem
 * diacríticos na coluna. É um superconjunto do filtro preciso `isSensitiveName`
 * — a checagem de palavra inteira acontece depois, no client.
 */
function buildOrFilter(keywords: readonly string[]): string {
  const patterns = new Set<string>()
  for (const kw of keywords) {
    const lower = kw.toLowerCase().trim()
    if (lower) patterns.add(lower)
    const norm = normalizeText(kw)
    if (norm) patterns.add(norm)
  }
  return [...patterns].map((p) => `nome.ilike.${p}*`).join(',')
}

/** Produto sensível detectado dentro de uma campanha. */
export interface SensitiveProduto {
  id: string
  ean: string | null
  nome: string | null
  campanha: string | null
  updated_at: string | null
}

export interface SensitiveProductsOptions {
  /** Keywords ativas (vindas de `alertas_config`). */
  keywords: readonly string[]
  /** ISO timestamp — retorna apenas produtos com `updated_at` mais recente. */
  since?: string
  /** Máximo de linhas retornadas (padrão 50). */
  limit?: number
}

/**
 * Produtos cuja primeira palavra casa uma keyword sensível E que estão
 * atualmente vinculados a uma campanha. Fonte de verdade compartilhada pelo
 * card do dashboard e pelo cron do digest diário de WhatsApp.
 */
export async function getSensitiveProdutosInCampanhas(
  supabase: SupabaseClient,
  { keywords, since, limit = 50 }: SensitiveProductsOptions,
): Promise<SensitiveProduto[]> {
  if (keywords.length === 0) return []

  let query = supabase
    .from('produtos_pai')
    .select('id, ean, nome, campanha, updated_at')
    .not('campanha', 'is', null)
    .or(buildOrFilter(keywords))
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (since) {
    query = query.gte('updated_at', since)
  }

  const { data, error } = await query
  if (error) {
    throw new Error(`Falha ao buscar produtos sensíveis: ${error.message}`)
  }

  return ((data ?? []) as SensitiveProduto[]).filter((p) =>
    isSensitiveName(p.nome, keywords),
  )
}
