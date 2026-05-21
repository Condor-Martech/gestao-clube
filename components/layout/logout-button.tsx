'use client'

import { useTransition } from 'react'
import { LogOut, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { signOutAction } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('auth')

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => startTransition(() => signOutAction())}
      disabled={isPending}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
      <span className="hidden sm:inline">{t('signOut')}</span>
    </Button>
  )
}
