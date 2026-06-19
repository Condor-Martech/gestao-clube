'use client'

import { useState, useTransition } from 'react'
import { LogOut, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePostHog } from 'posthog-js/react'
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
import { signOutAction } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const posthog = usePostHog()

  function handleConfirm(e: React.MouseEvent) {
    e.preventDefault()
    // reset() limpa o distinct_id para não vincular a próxima sessão (outro
    // usuário no mesmo browser) à pessoa que acabou de deslogar.
    posthog?.reset()
    startTransition(async () => {
      await signOutAction()
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
          <span className="hidden sm:inline">{t('signOut')}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('signOutConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('signOutConfirmDescription')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{tc('cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t('signOut')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
