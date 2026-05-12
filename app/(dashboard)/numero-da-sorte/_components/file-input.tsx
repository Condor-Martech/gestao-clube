'use client'

import { useEffect, useRef, useState } from 'react'
import { FileText, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  value: File | null | undefined
  onChange: (file: File | undefined) => void
  accept: 'image' | 'pdf'
  currentUrl?: string | null
  disabled?: boolean
  className?: string
}

const ACCEPT_MIME = {
  image: 'image/png,image/jpeg,image/jpg,image/webp',
  pdf: 'application/pdf',
}

export function FileInput({
  value,
  onChange,
  accept,
  currentUrl,
  disabled,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (value && accept === 'image') {
      const url = URL.createObjectURL(value)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setPreviewUrl(null)
  }, [value, accept])

  const showImageUrl =
    accept === 'image' ? (previewUrl ?? currentUrl ?? null) : null
  const showPdfBlock = accept === 'pdf' && (value || currentUrl)

  return (
    <div className={cn('space-y-2', className)}>
      {accept === 'image' ? (
        <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-md border">
          {showImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={showImageUrl}
              alt=""
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
              Sem imagem
            </div>
          )}
        </div>
      ) : null}

      {showPdfBlock ? (
        <div className="border-border bg-muted/40 flex items-center gap-2 rounded-md border p-3 text-sm">
          <FileText className="size-4 shrink-0" />
          {value ? (
            <span className="truncate">
              {value.name} · {(value.size / 1024).toFixed(0)} KB
            </span>
          ) : currentUrl ? (
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground truncate underline"
            >
              Ver atual
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_MIME[accept]}
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
          {value || currentUrl ? 'Trocar arquivo' : 'Selecionar arquivo'}
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
