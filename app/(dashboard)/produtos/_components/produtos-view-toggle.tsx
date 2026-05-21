'use client'

import { useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { LayoutGrid, List } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export type ProdutoView = 'list' | 'grid'

interface Props {
  value: ProdutoView
}

export function ProdutosViewToggle({ value }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const t = useTranslations('produtos')
  const [, startTransition] = useTransition()

  function setView(next: ProdutoView) {
    if (next === value) return
    const sp = new URLSearchParams(params.toString())
    if (next === 'list') sp.delete('view')
    else sp.set('view', next)
    const qs = sp.toString()
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname))
  }

  return (
    <div className="border-border bg-muted/40 inline-flex rounded-md border p-0.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setView('list')}
        className={cn('h-7 gap-1.5 px-2.5', value === 'list' && 'bg-background shadow')}
        aria-pressed={value === 'list'}
      >
        <List className="size-4" />
        <span className="hidden sm:inline">{t('viewList')}</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setView('grid')}
        className={cn('h-7 gap-1.5 px-2.5', value === 'grid' && 'bg-background shadow')}
        aria-pressed={value === 'grid'}
      >
        <LayoutGrid className="size-4" />
        <span className="hidden sm:inline">{t('viewGrid')}</span>
      </Button>
    </div>
  )
}
