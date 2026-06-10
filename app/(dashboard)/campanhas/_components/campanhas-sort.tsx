'use client'

import { useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowUpDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CAMPANHA_SORT_OPTIONS,
  DEFAULT_SORT,
  type CampanhaSortKey,
} from '@/lib/utils/campanha-sort'

export function CampanhasSort() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const t = useTranslations('campanhas')
  const tSort = useTranslations('campanhas.sort')
  const [, startTransition] = useTransition()

  const value = (params.get('sort') ?? DEFAULT_SORT) as CampanhaSortKey

  function handleChange(next: string) {
    const sp = new URLSearchParams(params.toString())
    if (next === DEFAULT_SORT) sp.delete('sort')
    else sp.set('sort', next)
    sp.delete('page')
    const qs = sp.toString()
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname))
  }

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-[220px]">
        <ArrowUpDown className="text-muted-foreground size-4" />
        <SelectValue placeholder={t('sortLabel')} />
      </SelectTrigger>
      <SelectContent>
        {CAMPANHA_SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {tSort(opt.labelKey)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
