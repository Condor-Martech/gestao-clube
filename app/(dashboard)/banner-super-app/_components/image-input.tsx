'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  value: File | null | undefined
  onChange: (file: File | undefined) => void
  currentUrl?: string | null
  disabled?: boolean
  className?: string
}

export function ImageInput({ value, onChange, currentUrl, disabled, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setPreviewUrl(null)
  }, [value])

  const showUrl = previewUrl ?? currentUrl

  return (
    <div className={cn('space-y-2', className)}>
      <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-md border">
        {showUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={showUrl} alt="" className="h-full w-full object-contain" />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
            Sem imagem
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          disabled={disabled}
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" />
          {value || currentUrl ? 'Trocar imagem' : 'Selecionar imagem'}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={() => onChange(undefined)}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
