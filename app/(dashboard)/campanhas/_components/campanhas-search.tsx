'use client'

import { useEffect, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CampanhasSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const t = useTranslations('campanhas')
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

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="campanha-search" className="text-muted-foreground whitespace-nowrap text-sm">
        {t('searchLabel')}
      </Label>
      <Input
        id="campanha-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('searchPlaceholder')}
        className="h-9 w-[260px]"
      />
    </div>
  )
}
