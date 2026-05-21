'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  page: number
  totalPages: number
}

export function PaginationControls({ page, totalPages }: Props) {
  const pathname = usePathname()
  const params = useSearchParams()
  const t = useTranslations('common')

  function hrefFor(target: number) {
    const next = new URLSearchParams(params.toString())
    if (target <= 1) next.delete('page')
    else next.set('page', String(target))
    const qs = next.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  const prevDisabled = page <= 1
  const nextDisabled = page >= totalPages

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={prevDisabled} asChild={!prevDisabled}>
          {prevDisabled ? (
            <span className="flex items-center gap-1">
              <ChevronLeft className="size-4" />
              {t('previous')}
            </span>
          ) : (
            <Link href={hrefFor(page - 1)} className="flex items-center gap-1">
              <ChevronLeft className="size-4" />
              {t('previous')}
            </Link>
          )}
        </Button>

        <span className="text-muted-foreground min-w-[80px] text-center text-sm">
          {t('page', { page, total: totalPages })}
        </span>

        <Button variant="outline" size="sm" disabled={nextDisabled} asChild={!nextDisabled}>
          {nextDisabled ? (
            <span className="flex items-center gap-1">
              {t('next')}
              <ChevronRight className="size-4" />
            </span>
          ) : (
            <Link href={hrefFor(page + 1)} className="flex items-center gap-1">
              {t('next')}
              <ChevronRight className="size-4" />
            </Link>
          )}
        </Button>
      </div>
    </div>
  )
}
