'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import type { Oferta } from '@/types/entities'
import { OfertaForm } from './oferta-form'

interface Props {
  oferta: Oferta
}

export function OfertaEditSheet({ oferta }: Props) {
  const [open, setOpen] = useState(false)
  const tCommon = useTranslations('common')
  const t = useTranslations('ofertasRegiao')

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="size-4" />
          {tCommon('edit')}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            {t('editTitle', { regiao: oferta.regiao ?? '—' })}
          </h2>
          <p className="text-muted-foreground text-sm">{t('editDescription')}</p>
        </div>
        <div className="mt-6">
          <OfertaForm oferta={oferta} onSuccess={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
