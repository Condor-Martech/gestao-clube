'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Upload, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { uploadProdutoImageAction } from '../_actions'

interface Props {
  produtoId: string
  field: 'img_internal' | 'img_external'
  currentUrl: string | null
  label: string
}

export function ProdutoImageUpload({ produtoId, field, currentUrl, label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('produtos.imageUpload')

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('id', produtoId)
    formData.append('field', field)
    formData.append('file', file)

    startTransition(async () => {
      const result = await uploadProdutoImageAction(formData)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setPreview(result.data?.url ?? null)
      toast.success(t('uploaded'))
    })
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-center gap-3">
        <div className="border-border bg-muted relative size-20 overflow-hidden rounded-md border">
          {preview ? (
            <Image
              src={preview}
              alt={label}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
              —
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleSelect}
          disabled={isPending}
        />
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
          {isPending ? t('uploading') : t('selectFile')}
        </Button>
      </div>
    </div>
  )
}
