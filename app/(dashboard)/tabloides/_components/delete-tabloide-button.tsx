'use client'

import { useState, useTransition } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
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
import type { Tabloide } from '@/types/entities'
import { deleteTabloideAction } from '../_actions'

interface Props {
  tabloide: Tabloide
}

export function DeleteTabloideButton({ tabloide }: Props) {
  const t = useTranslations('tabloides')
  const tc = useTranslations('common')

  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteTabloideAction(tabloide.id)
      if (!result.ok) {
        toast.error(result.error || t('deleteError'))
        return
      }
      toast.success(t('deleted'))
      setOpen(false)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="icon"
          className="absolute right-2 top-2 z-10 size-8 shadow-md"
          disabled={isPending}
          title={t('deleteButton')}
          aria-label={t('deleteButton')}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('deleteConfirmDescription', { name: tabloide.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{tc('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t('deleteConfirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
