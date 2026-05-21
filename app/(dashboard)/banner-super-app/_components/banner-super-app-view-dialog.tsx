'use client'

import { CalendarClock, ExternalLink } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { BannerSuperApp, EntrySchedule } from '@/types/entities'

interface Props {
  banner: BannerSuperApp
  schedule?: EntrySchedule
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

export function BannerSuperAppViewDialog({ banner, schedule, open, onOpenChange }: Props) {
  const t = useTranslations('banner_super_app')

  const isPublished = banner.publishedAt !== null
  const hasSchedule = schedule?.publishAt || schedule?.unpublishAt

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{banner.name ?? '—'}</span>
            <Badge variant={isPublished ? 'default' : 'secondary'}>
              {isPublished ? t('status.published') : t('status.draft')}
            </Badge>
          </DialogTitle>
          <DialogDescription className="font-mono">/{banner.slug}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {banner.image.url ? (
            <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-md border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={banner.image.url}
                alt={banner.image.alt ?? banner.name ?? ''}
                className="h-full w-full object-contain"
              />
            </div>
          ) : null}

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                {t('form.positionLabel')}
              </dt>
              <dd className="mt-1">
                <Badge variant="outline">{t(`positions.${banner.position}`)}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                {t('form.orderLabel')}
              </dt>
              <dd className="mt-1 font-medium">#{banner.order}</dd>
            </div>
          </dl>

          {banner.url ? (
            <a
              href={banner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border bg-muted/40 hover:bg-muted flex items-center gap-2 rounded-md border p-3 text-sm transition-colors"
            >
              <ExternalLink className="size-4 shrink-0" />
              <span className="truncate">{banner.url}</span>
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
