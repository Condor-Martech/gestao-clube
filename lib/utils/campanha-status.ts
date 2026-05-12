import type { BadgeProps } from '@/components/ui/badge'

type Variant = NonNullable<BadgeProps['variant']>

/**
 * Maps the loose `dsc_situacao` string from legacy data into a Badge variant.
 * Real values seen in legacy: "APROVADA", "EM REVISÃO", "REPROVADA",
 * "Ativa", "Inativa", and possibly free text. Default to outline so anything
 * unknown still renders.
 */
export function statusVariant(status: string | null | undefined): Variant {
  if (!status) return 'outline'
  const upper = status.trim().toUpperCase()

  if (upper === 'APROVADA' || upper === 'ATIVA') return 'success'
  if (upper === 'REPROVADA' || upper === 'INATIVA') return 'destructive'
  if (upper === 'EM REVISÃO' || upper === 'EM REVISAO' || upper === 'PENDENTE') {
    return 'warning'
  }
  return 'outline'
}
