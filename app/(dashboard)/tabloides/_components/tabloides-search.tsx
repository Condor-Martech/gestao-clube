'use client'

import { useEffect, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function TabloidesSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const t = useTranslations('tabloides')
  const [, startTransition] = useTransition()

  const [search, setSearch] = useState(params.get('q') ?? '')

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = new URLSearchParams(params.toString())
      if (search) next.set('q', search)
      else next.delete('q')
      next.delete('page')
      startTransition(() => router.replace(`${pathname}?${next.toString()}`))
    }, 300)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="tabloide-search" className="text-muted-foreground text-sm whitespace-nowrap">
        {t('searchLabel')}
      </Label>
      <Input
        id="tabloide-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('searchPlaceholder')}
        className="h-9 w-[260px]"
      />
    </div>
  )
}
