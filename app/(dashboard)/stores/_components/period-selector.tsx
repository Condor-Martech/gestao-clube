'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PERIOD_OPTIONS, type Period } from './period'

export function PeriodSelector({ value }: { value: Period }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations('stores.period')

  const handleChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', next)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px]" aria-label={t('label')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERIOD_OPTIONS.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {t(opt)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
