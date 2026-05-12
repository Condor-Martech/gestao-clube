export const PERIOD_OPTIONS = ['7d', '30d', '90d'] as const
export type Period = (typeof PERIOD_OPTIONS)[number]

export function periodToDays(p: string | null | undefined): number {
  if (p === '7d') return 7
  if (p === '90d') return 90
  return 30
}

export function parsePeriod(raw: string | null | undefined, fallback: Period = '30d'): Period {
  return (PERIOD_OPTIONS as readonly string[]).includes(raw ?? '') ? (raw as Period) : fallback
}
