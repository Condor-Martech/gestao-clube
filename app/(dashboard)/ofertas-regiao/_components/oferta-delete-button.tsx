'use client'

import { useState, useTransition } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { usePostHog } from 'posthog-js/react'
import { Button } from '@/components/ui/button'
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
import type { Oferta } from '@/types/entities'
import { OFERTAS_EVENTS } from '@/lib/posthog/events'
import { deleteOfertaAction } from '../_actions'

interface Props {
  oferta: Oferta
}

export function OfertaDeleteButton({ oferta }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const tCommon = useTranslations('common')
  const t = useTranslations('ofertasRegiao.delete')
  const posthog = usePostHog()

  const props = { oferta_id: oferta.id, regiao: oferta.regiao }

  function handleOpenChange(next: boolean) {
    if (next) posthog?.capture(OFERTAS_EVENTS.deleteDialogOpened, props)
    setOpen(next)
  }

  function handleConfirm() {
    posthog?.capture(OFERTAS_EVENTS.deleteConfirmed, props)
    startTransition(async () => {
      const result = await deleteOfertaAction(oferta.id)
      if (!result.ok) {
        posthog?.capture(OFERTAS_EVENTS.deleteFailed, { ...props, error: result.error })
        toast.error(result.error)
        return
      }
      posthog?.capture(OFERTAS_EVENTS.deleted, props)
      toast.success(t('success'))
      setOpen(false)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
          aria-label={tCommon('delete')}
          title={tCommon('delete')}
        >
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title', { regiao: oferta.regiao ?? '—' })}</AlertDialogTitle>
          <AlertDialogDescription>{t('description')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{tCommon('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t('confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
