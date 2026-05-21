'use client'

import { useEffect, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
  modules: string[]
  users: string[]
}

export function LogsFilters({ modules, users }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const t = useTranslations()
  const [, startTransition] = useTransition()

  const [search, setSearch] = useState(params.get('q') ?? '')

  useEffect(() => {
    setSearch(params.get('q') ?? '')
  }, [params])

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString())
    if (value && value !== ALL_VALUE) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    startTransition(() => router.replace(`${pathname}?${next.toString()}`))
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    setParam('q', search.trim() || null)
  }

  function clearAll() {
    setSearch('')
    startTransition(() => router.replace(pathname))
  }

  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const module = params.get('module') ?? ALL_VALUE
  const user = params.get('user') ?? ALL_VALUE
  const hasFilters = !!params.toString()

  return (
    <div className="flex flex-wrap items-end gap-3">
      <form onSubmit={submitSearch} className="space-y-1">
        <Label htmlFor="logs-search" className="text-xs">
          {t('logs.filterSearch')}
        </Label>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2" />
          <Input
            id="logs-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('logs.filterSearchPlaceholder')}
            className="w-[260px] pl-8"
          />
        </div>
      </form>

      <div className="space-y-1">
        <Label htmlFor="logs-from" className="text-xs">
          {t('logs.filterFrom')}
        </Label>
        <Input
          id="logs-from"
          type="date"
          value={from}
          onChange={(e) => setParam('from', e.target.value)}
          className="w-[160px]"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="logs-to" className="text-xs">
          {t('logs.filterTo')}
        </Label>
        <Input
          id="logs-to"
          type="date"
          value={to}
          onChange={(e) => setParam('to', e.target.value)}
          className="w-[160px]"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">{t('logs.filterModule')}</Label>
        <Select value={module} onValueChange={(v) => setParam('module', v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>{t('common.all')}</SelectItem>
            {modules.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">{t('logs.filterUser')}</Label>
        <Select value={user} onValueChange={(v) => setParam('user', v)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>{t('common.all')}</SelectItem>
            {users.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          <X className="size-4" />
          {t('common.clear')}
        </Button>
      )}
    </div>
  )
}
