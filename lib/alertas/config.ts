import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { DEFAULT_SENSITIVE_KEYWORDS } from '@/lib/sensitive-products'

/** Grupo de WhatsApp destinatário do resumo. */
export interface AlertaGrupo {
  /** JID do grupo (xxxxx@g.us) ou número de telefone. */
  jid: string
  /** Rótulo amigável exibido na tela de configuração. */
  label: string
}

/** Configuração dos alertas de produtos sensíveis. */
export interface AlertasConfig {
  keywords: string[]
  grupos: AlertaGrupo[]
  /** Horas do dia (0–23, fuso America/Sao_Paulo) em que o resumo é enviado. */
  horasResumo: number[]
  ativo: boolean
}

/** Fallback usado quando ainda não existe a linha de config no banco. */
export const DEFAULT_ALERTAS_CONFIG: AlertasConfig = {
  keywords: [...DEFAULT_SENSITIVE_KEYWORDS],
  grupos: [],
  horasResumo: [8],
  ativo: true,
}

interface AlertasConfigRow {
  keywords: string[] | null
  grupos: unknown
  horas_resumo: number[] | null
  ativo: boolean | null
}

/** Valida e normaliza o jsonb `grupos`, descartando entradas malformadas. */
function parseGrupos(raw: unknown): AlertaGrupo[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((g): AlertaGrupo[] => {
    if (!g || typeof g !== 'object') return []
    const { jid, label } = g as Record<string, unknown>
    if (typeof jid !== 'string' || !jid.trim()) return []
    return [{ jid: jid.trim(), label: typeof label === 'string' ? label : '' }]
  })
}

/**
 * Lê a linha única `alertas_config`. Se não existir (ou em caso de erro),
 * devolve os defaults — o feature nunca quebra por falta de configuração.
 */
export async function getAlertasConfig(
  supabase: SupabaseClient,
): Promise<AlertasConfig> {
  const { data, error } = await supabase
    .from('alertas_config')
    .select('keywords, grupos, horas_resumo, ativo')
    .eq('id', 1)
    .maybeSingle()

  if (error || !data) return DEFAULT_ALERTAS_CONFIG

  const row = data as AlertasConfigRow
  return {
    keywords: row.keywords ?? [],
    grupos: parseGrupos(row.grupos),
    horasResumo: row.horas_resumo ?? [],
    ativo: row.ativo ?? true,
  }
}
