'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function SearchForm() {
  const router = useRouter()
  const params = useSearchParams()
  const t = useTranslations('jornadaProduto')
  const [, startTransition] = useTransition()
  const [value, setValue] = useState(params.get('q') ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = value.trim()
    startTransition(() => {
      router.push(q ? `/jornada-produto?q=${encodeURIComponent(q)}` : '/jornada-produto')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl gap-2">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="pl-9"
          autoFocus
        />
      </div>
      <Button type="submit">{t('searchButton')}</Button>
    </form>
  )
}
