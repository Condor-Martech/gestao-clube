'use client'

import { useTransition } from 'react'
import { Check, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { approveProdutoAction } from '../_actions'

interface Props {
  produtoId: string
  approved: boolean
  canWrite?: boolean
}

export function ApproveButton({ produtoId, approved, canWrite = false }: Props) {
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('produtos')
  const tc = useTranslations('common')

  function handleClick() {
    startTransition(async () => {
      const result = await approveProdutoAction(produtoId, !approved)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(tc('saved'))
    })
  }

  if (!canWrite) return null

  return (
    <Button
      variant={approved ? 'outline' : 'default'}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : approved ? (
        <X className="size-4" />
      ) : (
        <Check className="size-4" />
      )}
      {approved ? t('unapproveButton') : t('approveButton')}
    </Button>
  )
}
