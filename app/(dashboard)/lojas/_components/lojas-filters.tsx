'use client'

import { useTransition, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, X } from 'lucide-react'
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

export function LojasFilters({ regions, currentSort }: { regions: string[]; currentSort: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const t = useTranslations()
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

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString())
    if (value && value !== ALL_VALUE) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    startTransition(() => router.replace(`${pathname}?${next.toString()}`))
  }

  function clearAll() {
    setSearch('')
    startTransition(() => router.replace(pathname))
  }

  const region = params.get('regiao') ?? ALL_VALUE
  const status = params.get('status') ?? ALL_VALUE
  const sort = params.get('sort') ?? currentSort
  const hasFilters = !!params.toString()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[240px] flex-1">
        <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('lojas.searchPlaceholder')}
          className="pl-8"
        />
      </div>

      <Select value={region} onValueChange={(v) => setParam('regiao', v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t('lojas.filterRegion')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{t('common.all')}</SelectItem>
          {regions.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={(v) => setParam('status', v)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder={t('lojas.filterStatus')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{t('common.all')}</SelectItem>
          <SelectItem value="active">{t('lojas.statusActive')}</SelectItem>
          <SelectItem value="inactive">{t('lojas.statusInactive')}</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={(v) => setParam('sort', v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t('lojas.filterSort')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="title:asc">{t('lojas.sortTitleAsc')}</SelectItem>
          <SelectItem value="title:desc">{t('lojas.sortTitleDesc')}</SelectItem>
          <SelectItem value="regiao:asc">{t('lojas.sortRegiao')}</SelectItem>
          <SelectItem value="cidade:asc">{t('lojas.sortCidade')}</SelectItem>
          <SelectItem value="codLoja:asc">{t('lojas.sortCodLoja')}</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          <X className="size-4" />
          {t('common.clear')}
        </Button>
      )}
    </div>
  )
}
