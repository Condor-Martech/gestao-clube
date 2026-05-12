'use client'

import { useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type ProductFilter = 'with' | 'without'

export function StatusTabs({ value }: { value: ProductFilter }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const t = useTranslations('campanhas')
  const [, startTransition] = useTransition()

  function handleChange(next: string) {
    const sp = new URLSearchParams(params.toString())
    sp.set('hasProducts', next)
    sp.delete('page')
    startTransition(() => router.replace(`${pathname}?${sp.toString()}`))
  }

  return (
    <Tabs value={value} onValueChange={handleChange} className="w-full sm:w-auto">
      <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-flex">
        <TabsTrigger value="with">{t('tabWithProducts')}</TabsTrigger>
        <TabsTrigger value="without">{t('tabWithoutProducts')}</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
