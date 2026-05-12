'use client'

import { useRef, useTransition } from 'react'
import Image from 'next/image'
import { Upload, Loader2, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  removeBannerImageAction,
  uploadBannerImageAction,
} from '../_actions'

type Field = 'carrosel' | 'carrosel2' | 'carrosel3'

interface Props {
  bannerId: string
  field: Field
  images: string[]
}

export function CarouselManager({ bannerId, field, images }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('banner.carousels')
  const tImg = useTranslations('produtos.imageUpload')

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('id', bannerId)
    formData.append('field', field)
    formData.append('file', file)

    startTransition(async () => {
      const result = await uploadBannerImageAction(formData)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(tImg('uploaded'))
    })

    e.target.value = ''
  }

  function handleRemove(url: string) {
    startTransition(async () => {
      const result = await removeBannerImageAction(bannerId, field, url)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(t('remove'))
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{t(field)}</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {t('addImage')}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleSelect}
          disabled={isPending}
        />
      </div>

      {images.length === 0 ? (
        <p className="text-muted-foreground bg-muted/30 rounded-md p-3 text-center text-xs">
          {t('empty')}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((url) => (
            <div
              key={url}
              className="border-border bg-muted relative aspect-video overflow-hidden rounded-md border"
            >
              <Image
                src={url}
                alt="banner"
                fill
                sizes="(max-width: 640px) 33vw, 25vw"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                disabled={isPending}
                className="bg-destructive/80 hover:bg-destructive text-destructive-foreground absolute right-1 top-1 rounded p-1 transition-colors"
                aria-label={t('remove')}
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
