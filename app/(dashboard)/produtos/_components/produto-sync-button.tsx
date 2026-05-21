'use client'

import { useState, useTransition } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { syncProdutoBipAction } from '../_actions'

interface Props {
  campanhaCode: string | null
  className?: string
  variant?: 'floating' | 'ghost'
}

export function ProdutoSyncButton({ campanhaCode, className, variant = 'floating' }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('produtos')
  const tc = useTranslations('common')

  function handleConfirm(e: React.MouseEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await syncProdutoBipAction(campanhaCode)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(t('syncSuccess'))
      setOpen(false)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {variant === 'ghost' ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isPending || !campanhaCode}
            title={t('syncTitle')}
            aria-label={t('syncTitle')}
            onClick={(e) => e.stopPropagation()}
            className={cn('text-muted-foreground', className)}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
        ) : (
          <button
            type="button"
            disabled={isPending || !campanhaCode}
            title={t('syncTitle')}
            aria-label={t('syncTitle')}
            onClick={(e) => e.stopPropagation()}
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
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('syncConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('syncConfirmDescription', { code: campanhaCode ?? '' })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{tc('cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t('syncConfirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
