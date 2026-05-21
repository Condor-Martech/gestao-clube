'use client'

import { useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CampanhaForm } from './campanha-form'
import type { Campanha } from '@/types/entities'

interface Props {
  campanha?: Campanha
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CampanhaDialog({ campanha, trigger, open, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const t = useTranslations('campanhas')

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setOpen = isControlled ? onOpenChange! : setInternalOpen

  const isEdit = !!campanha

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger !== undefined ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isControlled && !isEdit ? (
        <DialogTrigger asChild>
          <Button>
            <Plus className="size-4" />
            {t('addButton')}
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t('form.editTitle') : t('form.addTitle')}</DialogTitle>
          <DialogDescription>
            {isEdit ? t('form.editDescription') : t('form.addDescription')}
          </DialogDescription>
        </DialogHeader>
        <CampanhaForm
          variant={isEdit ? { mode: 'edit', campanha: campanha! } : { mode: 'create' }}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
