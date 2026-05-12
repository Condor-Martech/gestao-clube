'use client'

import { useMemo, useState, useTransition } from 'react'
import { Archive, Eye, Globe, Loader2, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BannerSuperAppFormDialog } from './banner-super-app-form-dialog'
import { BannerSuperAppViewDialog } from './banner-super-app-view-dialog'
import {
  deleteBannerSuperAppAction,
  publishBannerSuperAppAction,
  unpublishBannerSuperAppAction,
} from '../_actions'
import type { BannerSuperApp, EntrySchedule } from '@/types/entities'

interface Props {
  items: BannerSuperApp[]
  schedules: Record<number, EntrySchedule>
  canWrite?: boolean
}

export function BannerSuperAppTable({ items, schedules, canWrite = false }: Props) {
  const [filter, setFilter] = useState('')
  const t = useTranslations('banner_super_app')
  const tCommon = useTranslations('common')


  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (i) =>
        (i.name ?? '').toLowerCase().includes(q) ||
        i.slug.toLowerCase().includes(q) ||
        i.position.toLowerCase().includes(q),
    )
  }, [items, filter])

  return (
    <div className="space-y-3">
      <Input
        type="search"
        placeholder={t('searchPlaceholder')}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-sm"
      />

      <div className="border-border overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">{t('columns.image')}</TableHead>
              <TableHead>{t('columns.name')}</TableHead>
              <TableHead className="w-[120px]">
                {t('columns.position')}
              </TableHead>
              <TableHead className="w-[80px] text-right">
                {t('columns.order')}
              </TableHead>
              <TableHead className="w-[100px]">
                {t('columns.status')}
              </TableHead>
              <TableHead className="w-[140px] text-right">
                {tCommon('actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground p-12 text-center"
                >
                  {filter ? tCommon('noResults') : t('empty')}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((b) => (
                <BannerRow
                  key={b.id}
                  banner={b}
                  schedule={schedules[b.id]}
                  canWrite={canWrite}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function BannerRow({
  banner,
  schedule,
  canWrite = false,
}: {
  banner: BannerSuperApp
  schedule: EntrySchedule | undefined
  canWrite?: boolean
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('banner_super_app')
  const tCommon = useTranslations('common')

  const isPublished = banner.publishedAt !== null

  function handleTogglePublish() {
    startTransition(async () => {
      const r = isPublished
        ? await unpublishBannerSuperAppAction(banner.id)
        : await publishBannerSuperAppAction(banner.id)
      if (!r.ok) {
        toast.error(r.error)
        return
      }
      toast.success(isPublished ? t('unpublished') : t('published'))
    })
  }

  return (
    <>
      <TableRow>
        <TableCell>
          <button
            type="button"
            onClick={() => setViewOpen(true)}
            className="bg-muted relative aspect-video w-16 overflow-hidden rounded"
            aria-label={tCommon('viewDetails')}
          >
            {banner.image.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={banner.image.url}
                alt={banner.image.alt ?? banner.name ?? ''}
                className="h-full w-full object-cover"
              />
            ) : null}
          </button>
        </TableCell>
        <TableCell className="font-medium">
          <div className="space-y-0.5">
            <p>{banner.name ?? '—'}</p>
            <p className="text-muted-foreground font-mono text-xs">
              /{banner.slug}
            </p>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline">{t(`positions.${banner.position}`)}</Badge>
        </TableCell>
        <TableCell className="text-right font-mono text-xs">
          #{banner.order}
        </TableCell>
        <TableCell>
          <Badge variant={isPublished ? 'default' : 'secondary'}>
            {isPublished ? t('status.published') : t('status.draft')}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewOpen(true)}
              title={tCommon('viewDetails')}
            >
              <Eye className="size-4" />
            </Button>
            {canWrite && (
              <>
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
                    <Archive className="size-4" />
                  ) : (
                    <Globe className="size-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditOpen(true)}
                  title={tCommon('edit')}
                >
                  <Pencil className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      title={t('deleteConfirm')}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('deleteConfirm')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('deleteConfirmDesc')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => {
                          startTransition(async () => {
                            const r = await deleteBannerSuperAppAction(banner.id)
                            if (!r.ok) toast.error(r.error)
                            else toast.success(t('deleted'))
                          })
                        }}
                      >
                        {tCommon('delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>
      <BannerSuperAppViewDialog
        banner={banner}
        schedule={schedule}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
      <BannerSuperAppFormDialog
        banner={banner}
        schedule={schedule}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}
