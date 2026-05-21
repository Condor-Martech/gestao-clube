'use client'

import { useEffect, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ALL_VALUE = '__all__'

export function ProdutosFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const t = useTranslations('produtos')
  const tc = useTranslations('common')
  const [, startTransition] = useTransition()

  const [search, setSearch] = useState(params.get('search') ?? '')

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = new URLSearchParams(params.toString())
      if (search) next.set('search', search)
      else next.delete('search')
      next.delete('page')
      startTransition(() => router.replace(`${pathname}?${next.toString()}`))
    }, 300)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  function setApproved(value: string) {
    const next = new URLSearchParams(params.toString())
    if (value === ALL_VALUE) next.delete('approved')
    else next.set('approved', value)
    next.delete('page')
    startTransition(() => router.replace(`${pathname}?${next.toString()}`))
  }

  function clearAll() {
    setSearch('')
    startTransition(() => router.replace(pathname))
  }

  const approved = params.get('approved') ?? ALL_VALUE
  const hasFilters = !!params.toString()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[240px] flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="pl-8"
        />
      </div>
      <Select value={approved} onValueChange={setApproved}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t('filterApproved')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{t('filterApprovedAll')}</SelectItem>
          <SelectItem value="yes">{t('filterApprovedYes')}</SelectItem>
          <SelectItem value="no">{t('filterApprovedNo')}</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          <X className="size-4" />
          {tc('clear')}
        </Button>
      )}
    </div>
  )
}
