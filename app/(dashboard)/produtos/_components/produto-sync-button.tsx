'use client'

import { useTransition } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface Props {
  produtoId: string
  className?: string
}

/**
 * Triggers a "refresh this product" backend call. Wired as a placeholder
 * until the actual sync endpoint is exposed via a Route Handler in Fase 9.
 */
export function ProdutoSyncButton({ produtoId, className }: Props) {
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('produtos')

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    startTransition(async () => {
      // TODO(fase 9): fetch('/api/produtos/${id}/sync', { method: 'POST' })
      // For now, surface a toast so the UX is wired end-to-end.
      void produtoId
      await new Promise((r) => setTimeout(r, 350))
      toast.message(t('syncTitle'), { description: t('syncPending') })
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      title={t('syncTitle')}
      aria-label={t('syncTitle')}
      className={cn(
        'bg-sky-500 text-white shadow-md transition-colors hover:bg-sky-600 disabled:opacity-70',
        'inline-flex items-center justify-center rounded-full',
        className,
      )}
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <RefreshCw className="size-3.5" />
      )}
    </button>
  )
}
