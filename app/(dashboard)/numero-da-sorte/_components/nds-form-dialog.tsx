'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import {
  NumeroDaSorteCreateSchema,
  NumeroDaSorteUpdateSchema,
  type NumeroDaSorteCreateInput,
  type NumeroDaSorteUpdateInput,
} from '@/lib/validators/numero-da-sorte'
import {
  createNumeroDaSorteAction,
  publishNumeroDaSorteAction,
  unpublishNumeroDaSorteAction,
  updateNumeroDaSorteAction,
} from '../_actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { utcIsoToBrtLocal } from '@/lib/strapi/schedule'
import { FileInput } from './file-input'
import type { EntrySchedule, NumeroDaSorte } from '@/types/entities'

interface Props {
  nds?: NumeroDaSorte
  schedule?: EntrySchedule
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type FormValues = NumeroDaSorteCreateInput | NumeroDaSorteUpdateInput

export function NDSFormDialog({
  nds,
  schedule,
  trigger,
  open,
  onOpenChange,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('numero_da_sorte')
  const tForm = useTranslations('numero_da_sorte.form')
  const tCommon = useTranslations('common')

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setOpen = isControlled ? onOpenChange! : setInternalOpen

  const isEdit = !!nds

  const form = useForm<FormValues>({
    resolver: zodResolver(
      isEdit ? NumeroDaSorteUpdateSchema : NumeroDaSorteCreateSchema,
    ),
    defaultValues: {
      titulo: nds?.titulo ?? '',
      numeroCampanha: nds?.numeroCampanha ?? 0,
      startDate: nds?.startDate ?? '',
      endDate: nds?.endDate ?? '',
      banner: undefined,
      bannerSmall: undefined,
      regulamento: undefined,
      publishAt: schedule?.publishAt ? utcIsoToBrtLocal(schedule.publishAt) : '',
      unpublishAt: schedule?.unpublishAt
        ? utcIsoToBrtLocal(schedule.unpublishAt)
        : '',
    },
  })

  function onSubmit(values: FormValues, mode: 'draft' | 'publish') {
    startTransition(async () => {
      const saveResult = isEdit
        ? await updateNumeroDaSorteAction(nds.id, values)
        : await createNumeroDaSorteAction(values)

      if (!saveResult.ok) {
        toast.error(saveResult.error)
        return
      }

      const id = isEdit ? nds.id : saveResult.data?.id
      if (!id) {
        toast.error('ID inválido')
        return
      }

      const pubResult =
        mode === 'publish'
          ? await publishNumeroDaSorteAction(id)
          : await unpublishNumeroDaSorteAction(id)

      if (!pubResult.ok) {
        toast.warning(pubResult.error)
      } else {
        toast.success(
          mode === 'publish'
            ? t('published')
            : t(isEdit ? 'updated' : 'created'),
        )
      }

      form.reset()
      setOpen(false)
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger !== undefined ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isControlled && !isEdit ? (
        <DialogTrigger asChild>
          <Button>
            <Plus className="size-4" />
            {t('addButton')}
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? tForm('editTitle') : tForm('addTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? tForm('editDescription') : tForm('addDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tForm('tituloLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isPending}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="numeroCampanha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tForm('numeroLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        disabled={isPending}
                        {...field}
                        value={field.value ?? 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tForm('startLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={isPending}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tForm('endLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={isPending}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="banner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tForm('bannerLabel')}</FormLabel>
                  <FormControl>
                    <FileInput
                      value={field.value as File | undefined}
                      onChange={field.onChange}
                      accept="image"
                      currentUrl={nds?.banner.url}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>{tForm('bannerHelp')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bannerSmall"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tForm('bannerSmallLabel')}</FormLabel>
                  <FormControl>
                    <FileInput
                      value={field.value as File | undefined}
                      onChange={field.onChange}
                      accept="image"
                      currentUrl={nds?.bannerSmall?.url ?? null}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="regulamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tForm('regulamentoLabel')}</FormLabel>
                  <FormControl>
                    <FileInput
                      value={field.value as File | undefined}
                      onChange={field.onChange}
                      accept="pdf"
                      currentUrl={nds?.regulamento.url}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>{tForm('regulamentoHelp')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-border space-y-3 rounded-md border p-3">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                {tForm('scheduleSection')}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="publishAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tForm('publishAtLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          disabled={isPending}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unpublishAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tForm('unpublishAtLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          disabled={isPending}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                {tForm('scheduleHelp')}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                {tCommon('cancel')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={form.handleSubmit((v) =>
                  onSubmit(v as FormValues, 'draft'),
                )}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {tForm('saveDraft')}
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit((v) =>
                  onSubmit(v as FormValues, 'publish'),
                )}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {tForm('publish')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
