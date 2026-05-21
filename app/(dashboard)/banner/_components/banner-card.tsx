'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Pencil, Trash2, Loader2, Globe } from 'lucide-react'
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
import { BannerFormDialog } from './banner-form-dialog'
import { CarouselManager } from './carousel-manager'
import { deleteBannerAction } from '../_actions'
import type { Oferta } from '@/types/entities'

interface Props {
  banner: Oferta
}

export function BannerCard({ banner }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const tBanner = useTranslations('banner')
  const tCommon = useTranslations('common')

  const allImages = [
    ...(banner.carrosel ?? []),
    ...(banner.carrosel2 ?? []),
    ...(banner.carrosel3 ?? []),
  ]
  const cover = allImages[0]

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteBannerAction(banner.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(tBanner('deleted'))
    })
  }

  return (
    <article className="border-border bg-card overflow-hidden rounded-lg border">
      <div className="bg-muted relative aspect-video w-full">
        {cover ? (
          <Image
            src={cover}
            alt={banner.title ?? ''}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
            {tBanner('carousels.empty')}
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h3 className="leading-tight font-semibold">{banner.title ?? '—'}</h3>
            <p className="text-muted-foreground font-mono text-xs">/{banner.slug ?? ''}</p>
          </div>
          <div className="flex items-center gap-1">
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
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
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

        {(banner.regiao || banner.video) && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {banner.regiao && <Badge variant="outline">{banner.regiao}</Badge>}
            {banner.video && (
              <a
                href={banner.video}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <Globe className="size-3" />
                vídeo
              </a>
            )}
          </div>
        )}

        <div className="space-y-3 border-t pt-3">
          <CarouselManager bannerId={banner.id} field="carrosel" images={banner.carrosel ?? []} />
          <CarouselManager bannerId={banner.id} field="carrosel2" images={banner.carrosel2 ?? []} />
          <CarouselManager bannerId={banner.id} field="carrosel3" images={banner.carrosel3 ?? []} />
        </div>
      </div>

      <BannerFormDialog banner={banner} open={editOpen} onOpenChange={setEditOpen} />
    </article>
  )
}
