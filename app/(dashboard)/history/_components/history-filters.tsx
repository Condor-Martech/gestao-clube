'use client'

import { useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export function HistoryFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const t = useTranslations()
  const [, startTransition] = useTransition()

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    startTransition(() => router.replace(`${pathname}?${next.toString()}`))
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="history-from" className="text-xs">
          {t('history.filterFrom')}
        </Label>
        <Input
          id="history-from"
          type="date"
          value={params.get('from') ?? ''}
          onChange={(e) => setParam('from', e.target.value)}
          className="w-[160px]"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="history-to" className="text-xs">
          {t('history.filterTo')}
        </Label>
        <Input
          id="history-to"
          type="date"
          value={params.get('to') ?? ''}
          onChange={(e) => setParam('to', e.target.value)}
          className="w-[160px]"
        />
      </div>
      {params.toString() && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => startTransition(() => router.replace(pathname))}
        >
          <X className="size-4" />
          {t('common.clear')}
        </Button>
      )}
    </div>
  )
}
