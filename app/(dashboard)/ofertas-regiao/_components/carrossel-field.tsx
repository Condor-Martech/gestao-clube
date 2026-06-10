'use client'

import Image from 'next/image'
import { Plus, Trash2 } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import type { OfertaUpdateInput } from '@/lib/validators/oferta'

type CarrosselName = 'carrosel' | 'carrosel2' | 'carrosel3'

interface Props {
  name: CarrosselName
  disabled?: boolean
}

export function CarrosselField({ name, disabled }: Props) {
  const t = useTranslations('ofertasRegiao.form.carrossel')
  const form = useFormContext<OfertaUpdateInput>()
  const images = form.watch(`${name}.images`) ?? []

  function appendImage() {
    form.setValue(`${name}.images`, [...images, ''], { shouldDirty: true, shouldValidate: false })
  }

  function removeImage(index: number) {
    const next = images.filter((_, i) => i !== index)
    form.setValue(`${name}.images`, next, { shouldDirty: true, shouldValidate: true })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr,140px]">
        <FormField
          control={form.control}
          name={`${name}.titulo`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('tituloLabel')}</FormLabel>
              <FormControl>
                <Input disabled={disabled} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${name}.cor`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('corLabel')}</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    disabled={disabled}
                    value={field.value || '#000000'}
                    onChange={field.onChange}
                    className="border-input bg-background h-9 w-12 cursor-pointer rounded border"
                    aria-label={t('corLabel')}
                  />
                  <Input
                    disabled={disabled}
                    value={field.value || ''}
                    onChange={field.onChange}
                    className="font-mono"
                    placeholder="#000000"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <FormLabel>{t('imagesLabel', { count: images.length })}</FormLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={appendImage}
            disabled={disabled || images.length >= 20}
          >
            <Plus className="size-4" />
            {t('addImage')}
          </Button>
        </div>

        {images.length === 0 ? (
          <p className="text-muted-foreground bg-muted/30 rounded-md p-3 text-center text-xs">
            {t('emptyImages')}
          </p>
        ) : (
          <div className="space-y-2">
            {images.map((_, index) => (
              <ImageRow
                key={`${name}-${index}`}
                name={name}
                index={index}
                disabled={disabled}
                onRemove={() => removeImage(index)}
              />
            ))}
            <FormField
              control={form.control}
              name={`${name}.images`}
              render={() => (
                <FormItem>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </div>
    </div>
  )
}

interface ImageRowProps {
  name: CarrosselName
  index: number
  disabled?: boolean
  onRemove: () => void
}

function ImageRow({ name, index, disabled, onRemove }: ImageRowProps) {
  const form = useFormContext<OfertaUpdateInput>()
  const url = form.watch(`${name}.images.${index}`)
  const isValid = typeof url === 'string' && /^https?:\/\//.test(url)

  return (
    <div className="border-border bg-muted/20 flex items-start gap-2 rounded-md border p-2">
      <div className="bg-muted relative size-12 shrink-0 overflow-hidden rounded">
        {isValid ? (
          <Image src={url} alt="" fill sizes="48px" className="object-cover" unoptimized />
        ) : null}
      </div>
      <div className="flex-1">
        <FormField
          control={form.control}
          name={`${name}.images.${index}`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="url" placeholder="https://..." disabled={disabled} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        disabled={disabled}
        className="text-muted-foreground hover:text-destructive"
        aria-label="remove"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}
