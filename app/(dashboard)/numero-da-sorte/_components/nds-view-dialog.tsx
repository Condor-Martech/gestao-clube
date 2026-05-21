'use client'

import { CalendarClock, FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils/format'
import type { EntrySchedule, NumeroDaSorte } from '@/types/entities'

interface Props {
  nds: NumeroDaSorte
  schedule: EntrySchedule | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

const BRT_DATETIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function formatBRT(iso: string): string {
  return BRT_DATETIME.format(new Date(iso))
}

type Status = 'rascunho' | 'agendado' | 'ativo' | 'encerrado'

function computeStatus(nds: NumeroDaSorte): Status {
  if (!nds.publishedAt) return 'rascunho'
  const today = new Date().toISOString().slice(0, 10)
  if (today < nds.startDate) return 'agendado'
  if (today > nds.endDate) return 'encerrado'
  return 'ativo'
}

const STATUS_VARIANT: Record<Status, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  rascunho: 'secondary',
  agendado: 'outline',
  ativo: 'default',
  encerrado: 'outline',
}

export function NDSViewDialog({ nds, schedule, open, onOpenChange }: Props) {
  const t = useTranslations('numero_da_sorte')

  const status = computeStatus(nds)
  const hasSchedule = schedule?.publishAt || schedule?.unpublishAt

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{nds.titulo}</span>
            <Badge variant={STATUS_VARIANT[status]}>{t(`status.${status}`)}</Badge>
          </DialogTitle>
          <DialogDescription className="font-mono">#{nds.numeroCampanha}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {nds.banner.url ? (
            <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-md border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={nds.banner.url} alt={nds.titulo} className="h-full w-full object-contain" />
            </div>
          ) : null}

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                {t('form.startLabel')}
              </dt>
              <dd className="mt-1 font-medium">{formatDate(nds.startDate)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                {t('form.endLabel')}
              </dt>
              <dd className="mt-1 font-medium">{formatDate(nds.endDate)}</dd>
            </div>
          </dl>

          {nds.bannerSmall?.url ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs tracking-wide uppercase">
                {t('form.bannerSmallLabel')}
              </p>
              <div className="bg-muted relative aspect-video w-48 overflow-hidden rounded-md border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={nds.bannerSmall.url} alt="" className="h-full w-full object-contain" />
              </div>
            </div>
          ) : null}

          {nds.regulamento.url ? (
            <a
              href={nds.regulamento.url}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border bg-muted/40 hover:bg-muted flex items-center gap-2 rounded-md border p-3 text-sm transition-colors"
            >
              <FileText className="size-4 shrink-0" />
              <span className="font-medium">{t('viewRegulamento')}</span>
            </a>
          ) : null}

          {hasSchedule ? (
            <div className="border-border space-y-2 rounded-md border p-3">
              <p className="text-muted-foreground flex items-center gap-2 text-xs tracking-wide uppercase">
                <CalendarClock className="size-3" />
                {t('schedule.title')}
              </p>
              {schedule?.publishAt ? (
                <p className="text-sm">
                  <span className="text-muted-foreground">{t('schedule.publishAt')}:</span>{' '}
                  <span className="font-medium">{formatBRT(schedule.publishAt)}</span>
                </p>
              ) : null}
              {schedule?.unpublishAt ? (
                <p className="text-sm">
                  <span className="text-muted-foreground">{t('schedule.unpublishAt')}:</span>{' '}
                  <span className="font-medium">{formatBRT(schedule.unpublishAt)}</span>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
