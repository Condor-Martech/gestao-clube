'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2, Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { BannerSuperAppFormDialog } from './banner-super-app-form-dialog'
import {
  deleteBannerSuperAppAction,
  publishBannerSuperAppAction,
  unpublishBannerSuperAppAction,
} from '../_actions'
import type { BannerSuperApp, EntrySchedule } from '@/types/entities'

interface Props {
  banner: BannerSuperApp
  schedule?: EntrySchedule
}

export function BannerSuperAppCard({ banner, schedule }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('banner_super_app')
  const tCommon = useTranslations('common')

  const isPublished = banner.publishedAt !== null

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteBannerSuperAppAction(banner.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(t('deleted'))
    })
  }

  function handleTogglePublish() {
    startTransition(async () => {
      const result = isPublished
        ? await unpublishBannerSuperAppAction(banner.id)
        : await publishBannerSuperAppAction(banner.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(isPublished ? t('unpublished') : t('published'))
    })
  }

  return (
    <article className="border-border bg-card overflow-hidden rounded-lg border">
      <div className="bg-muted relative aspect-video w-full">
        {banner.image.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={banner.image.url}
            alt={banner.image.alt ?? banner.name ?? ''}
            className="h-full w-full object-cover"
          />
        ) : null}
        <Badge variant={isPublished ? 'default' : 'secondary'} className="absolute top-2 right-2">
          {isPublished ? t('status.published') : t('status.draft')}
        </Badge>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h3 className="leading-tight font-semibold">{banner.name ?? '—'}</h3>
            <p className="text-muted-foreground font-mono text-xs">/{banner.slug}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <Badge variant="outline">{t(`positions.${banner.position}`)}</Badge>
              <span className="text-muted-foreground">#{banner.order}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleTogglePublish}
              disabled={isPending}
              title={isPublished ? t('unpublish') : t('publish')}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isPublished ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={isPending}
                >
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{tCommon('confirmDeleteTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {tCommon('confirmDeleteDescription')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault()
                      handleDelete()
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {tCommon('delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {banner.url ? (
          <a
            href={banner.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground block truncate text-xs"
          >
            {banner.url}
          </a>
        ) : null}
      </div>

      <BannerSuperAppFormDialog
        banner={banner}
        schedule={schedule}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </article>
  )
}
