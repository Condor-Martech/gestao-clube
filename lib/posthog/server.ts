import 'server-only'
import { PostHog } from 'posthog-node'

// Cliente PostHog server-side (posthog-node) para capturar eventos a partir de
// Server Actions e Route Handlers — onde o SDK do browser não chega.
//
// Singleton lazy: só instancia quando há chave. Sem chave → null → no-op.
let client: PostHog | null = null

export function getPostHogServer(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return null
  if (!client) {
    client = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      // Em ambiente serverless o processo pode morrer entre requests; flush
      // imediato garante que o evento sai antes de a função terminar.
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return client
}

/**
 * Captura um evento server-side e faz flush. Silencioso se o PostHog não estiver
 * configurado — nunca propaga erro pra lógica de negócio.
 */
export async function captureServerEvent(
  event: string,
  distinctId: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  const ph = getPostHogServer()
  if (!ph || !distinctId) return
  try {
    ph.capture({ distinctId, event, properties })
    await ph.flush()
  } catch {
    // Telemetria nunca deve derrubar a ação do usuário.
  }
}
