import type { BadgeProps } from '@/components/ui/badge'

type Variant = NonNullable<BadgeProps['variant']>

/**
 * Maps `dsc_situacao` into a Badge variant. Only three values get color;
 * everything else (including APROVADA — visible via its own tab) renders
 * neutral.
 */
export function statusVariant(status: string | null | undefined): Variant {
  if (!status) return 'outline'
  const upper = status.trim().toUpperCase()

  if (upper === 'CONVERTIDA') return 'success'
  if (upper === 'ENCERRADA') return 'destructive'
  if (upper === 'CONFIRMADA MKT') return 'warning'
  return 'outline'
}
