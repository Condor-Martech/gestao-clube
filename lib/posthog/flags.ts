import 'server-only'
import { getPostHogServer } from './server'

// Helper de feature flags server-side. No cliente, usar o hook
// `useFeatureFlagEnabled('flag')` de 'posthog-js/react'.
//
// Uso típico num Server Component / Action:
//   const novo = await isServerFeatureEnabled('novo-fluxo-ofertas', userId)
//   if (novo) { ... }

export async function isServerFeatureEnabled(flag: string, distinctId: string): Promise<boolean> {
  const ph = getPostHogServer()
  if (!ph || !distinctId) return false
  try {
    return (await ph.isFeatureEnabled(flag, distinctId)) ?? false
  } catch {
    return false
  }
}

export async function getServerFeatureFlag(
  flag: string,
  distinctId: string,
): Promise<string | boolean | undefined> {
  const ph = getPostHogServer()
  if (!ph || !distinctId) return undefined
  try {
    return await ph.getFeatureFlag(flag, distinctId)
  } catch {
    return undefined
  }
}
