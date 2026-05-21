'use client'

import { useTransition } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { syncStoresAction } from '../_actions'

interface Props {
  appId: string
}

export function SyncButton({ appId }: Props) {
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('stores.sync')

  function handleClick() {
    startTransition(async () => {
      const result = await syncStoresAction({ appId, force: true })

      if (!result.ok) {
        toast.error(t('error'), { description: result.error })
        return
      }

      const totalInserted = result.results.reduce((sum, r) => sum + r.reviewsInserted, 0)
      const errored = result.results.filter((r) => r.error)

      if (errored.length > 0) {
        toast.warning(t('partialError'), {
          description: errored.map((e) => `${e.store}: ${e.error}`).join(' · '),
        })
        return
      }

      toast.success(t('success'), {
        description: t('successDesc', { count: totalInserted }),
      })
    })
  }

  return (
    <Button onClick={handleClick} disabled={isPending} size="sm" variant="default">
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
      {isPending ? t('syncing') : t('button')}
    </Button>
  )
}
