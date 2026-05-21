import 'server-only'
import { env } from '@/lib/env'

interface SendTextParams {
  /** Número (5511...) ou JID de grupo (xxxxx@g.us). */
  to: string
  text: string
}

export type EvolutionResult = { ok: true } | { ok: false; error: string }

/**
 * Envia uma mensagem de texto pelo WhatsApp via Evolution API v2.
 *
 * Endpoint: `POST {EVOLUTION_API_URL}/message/sendText/{instance}`
 * Auth:     header `apikey`
 *
 * Para grupos, o JID do grupo (`xxxxx@g.us`) vai no campo `number` — a
 * Evolution API resolve grupo vs. contato automaticamente.
 */
export async function sendEvolutionText({
  to,
  text,
}: SendTextParams): Promise<EvolutionResult> {
  const { EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_API_INSTANCE } = env

  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_API_INSTANCE) {
    return {
      ok: false,
      error:
        'Evolution API não configurada (verifique EVOLUTION_API_URL / _KEY / _INSTANCE)',
    }
  }

  try {
    const res = await fetch(
      `${EVOLUTION_API_URL.replace(/\/$/, '')}/message/sendText/${EVOLUTION_API_INSTANCE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({ number: to, text, linkPreview: false }),
      },
    )

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      return {
        ok: false,
        error: `Evolution API respondeu ${res.status}${
          detail ? ` — ${detail.slice(0, 200)}` : ''
        }`,
      }
    }

    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Falha de rede',
    }
  }
}
