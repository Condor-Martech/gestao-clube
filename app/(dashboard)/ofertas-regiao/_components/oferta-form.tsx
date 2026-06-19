'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { usePostHog } from 'posthog-js/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OfertaUpdateSchema, type OfertaUpdateInput } from '@/lib/validators/oferta'
import { OFERTAS_EVENTS } from '@/lib/posthog/events'
import type { Oferta, OfertaCarrossel } from '@/types/entities'
import { updateOfertaAction } from '../_actions'
import { CarrosselField } from './carrossel-field'
import { YoutubePreview } from './youtube-preview'

const DEFAULT_CARROSSEL: OfertaCarrossel = { cor: '#000000', titulo: '', images: [] }

function carrosselDefault(value: OfertaCarrossel | null | undefined): OfertaCarrossel {
  return {
    cor: value?.cor ?? '#000000',
    titulo: value?.titulo ?? '',
    images: value?.images ?? [],
  }
}

interface Props {
  oferta: Oferta
  onSuccess?: () => void
}

type TabKey = 'geral' | 'c1' | 'c2' | 'c3'

const FIELD_TO_TAB: Record<string, TabKey> = {
  title: 'geral',
  video: 'geral',
  carrosel: 'c1',
  carrosel2: 'c2',
  carrosel3: 'c3',
}

export function OfertaForm({ oferta, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState<TabKey>('geral')
  const tCommon = useTranslations('common')
  const tForm = useTranslations('ofertasRegiao.form')
  const tPage = useTranslations('ofertasRegiao')
  const posthog = usePostHog()

  const form = useForm<OfertaUpdateInput>({
    resolver: zodResolver(OfertaUpdateSchema),
    defaultValues: {
      title: oferta.title ?? '',
      video: oferta.video ?? '',
      carrosel: carrosselDefault(oferta.carrosel),
      carrosel2: carrosselDefault(oferta.carrosel2),
      carrosel3: carrosselDefault(oferta.carrosel3),
    },
  })

  const videoValue = form.watch('video')
  const errors = form.formState.errors

  useEffect(() => {
    const keys = Object.keys(errors)
    if (keys.length === 0) return
    const firstErrorField = keys[0]
    if (!firstErrorField) return
    const targetTab = FIELD_TO_TAB[firstErrorField]
    if (targetTab && targetTab !== tab) setTab(targetTab)
  }, [errors, tab])

  function onSubmit(values: OfertaUpdateInput) {
    // Propriedades sem conteúdo do carrossel (evita PII/payloads grandes):
    // só sinalizamos quais campos foram preenchidos.
    const props = {
      oferta_id: oferta.id,
      regiao: oferta.regiao,
      has_video: Boolean(values.video),
      carrosseis_preenchidos: [values.carrosel, values.carrosel2, values.carrosel3].filter(
        (c) => (c?.images?.length ?? 0) > 0,
      ).length,
    }
    posthog?.capture(OFERTAS_EVENTS.formSubmitted, props)

    startTransition(async () => {
      const result = await updateOfertaAction(oferta.id, values)
      if (!result.ok) {
        posthog?.capture(OFERTAS_EVENTS.updateFailed, { ...props, error: result.error })
        toast.error(result.error)
        return
      }
      posthog?.capture(OFERTAS_EVENTS.updated, props)
      toast.success(tPage('updated'))
      onSuccess?.()
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="geral">{tForm('tabs.geral')}</TabsTrigger>
            <TabsTrigger value="c1">{tForm('tabs.c1')}</TabsTrigger>
            <TabsTrigger value="c2">{tForm('tabs.c2')}</TabsTrigger>
            <TabsTrigger value="c3">{tForm('tabs.c3')}</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tForm('titleLabel')}</FormLabel>
                  <FormControl>
                    <Input disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="video"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tForm('videoLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder={tForm('videoPlaceholder')}
                      disabled={isPending}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormDescription>{tForm('videoHelp')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <YoutubePreview url={videoValue} />
          </TabsContent>

          <TabsContent value="c1" className="space-y-4 pt-4">
            <CarrosselField name="carrosel" disabled={isPending} />
          </TabsContent>
          <TabsContent value="c2" className="space-y-4 pt-4">
            <CarrosselField name="carrosel2" disabled={isPending} />
          </TabsContent>
          <TabsContent value="c3" className="space-y-4 pt-4">
            <CarrosselField name="carrosel3" disabled={isPending} />
          </TabsContent>
        </Tabs>

        <div className="bg-background sticky bottom-0 flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess?.()}
            disabled={isPending}
          >
            {tCommon('cancel')}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {tCommon('save')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
