'use client'

import { useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ALL_VALUE = '__all__'

interface Props {
  regioes: string[]
}

export function RegiaoFilter({ regioes }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const t = useTranslations('tabloides')
  const [, startTransition] = useTransition()

  const current = params.get('regiao') ?? ALL_VALUE

  function onValueChange(value: string) {
    const next = new URLSearchParams(params.toString())
    if (value === ALL_VALUE) next.delete('regiao')
    else next.set('regiao', value)
    next.delete('page')
    startTransition(() => router.replace(`${pathname}?${next.toString()}`))
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs">{t('filterRegiao')}</Label>
      <Select value={current} onValueChange={onValueChange}>
        <SelectTrigger className="w-[220px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{t('filterRegiaoAll')}</SelectItem>
          {regioes.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
