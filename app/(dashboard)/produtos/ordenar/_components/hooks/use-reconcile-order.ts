import { useMemo } from 'react'

/**
 * Keeps a manually-ordered list in sync with an upstream input.
 * - Preserves manual order for EANs still present in input
 * - Drops EANs no longer in input
 * - Appends new EANs at the end
 */
export function reconcileOrder(input: string[], stored: string[]): string[] {
  const inputSet = new Set(input)
  const kept = stored.filter((ean) => inputSet.has(ean))
  const keptSet = new Set(kept)
  const appended = input.filter((ean) => !keptSet.has(ean))
  return [...kept, ...appended]
}

export function useReconcileOrder(input: string[], stored: string[]): string[] {
  return useMemo(() => reconcileOrder(input, stored), [input, stored])
}
