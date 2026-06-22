'use client'

import Link from 'next/link'
import { Layers } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Props {
  /** Campaign code the agrupamentos list lives under: /agrupamentos/{campanha} */
  campanha: string
  /** Icon-only rendering for tight spaces (e.g. grid card corner) */
  compact?: boolean
  className?: string
}

/**
 * Flags a parent product that actually heads an agrupamento and links to that
 * campaign's groupings list. Rendered only when the product's EAN is known to
 * head a group (see produtos_no_agrupamento intersection in the page).
 */
export function AgrupamentoBadge({ campanha, compact = false, className }: Props) {
  const t = useTranslations('produtos')
  const label = t('agrupamentoBadge')

  return (
    <Link
      href={`/agrupamentos/${campanha}` as `/${string}`}
      title={t('agrupamentoBadgeTitle')}
      aria-label={label}
      className={cn('inline-flex w-fit', className)}
    >
      <Badge variant="secondary" className="hover:bg-secondary/70 gap-1 transition-colors">
        <Layers className="size-3" />
        {!compact && label}
      </Badge>
    </Link>
  )
}
