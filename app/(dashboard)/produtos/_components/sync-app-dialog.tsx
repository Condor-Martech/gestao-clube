'use client'

import { useState, useTransition } from 'react'
import { Loader2, Smartphone } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { syncProdutosAppAction } from '../_actions'

interface Props {
  code: string
}

export function SyncAppDialog({ code }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('produtos.syncApp')

  function onConfirm() {
    startTransition(async () => {
      const result = await syncProdutosAppAction(code)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(t('success'))
      setOpen(false)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm">
          <Smartphone className="size-4" />
          {t('button')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('confirmDescription')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{t('no')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isPending}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {t('yes')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
