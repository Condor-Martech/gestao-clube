'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import {
  BANNER_SUPER_APP_POSITIONS,
  BannerSuperAppCreateSchema,
  BannerSuperAppUpdateSchema,
  type BannerSuperAppCreateInput,
  type BannerSuperAppUpdateInput,
} from '@/lib/validators/banner-super-app'
import {
  createBannerSuperAppAction,
  publishBannerSuperAppAction,
  unpublishBannerSuperAppAction,
  updateBannerSuperAppAction,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { utcIsoToBrtLocal } from '@/lib/strapi/schedule'
import { ImageInput } from './image-input'
import type { BannerSuperApp, EntrySchedule } from '@/types/entities'

interface Props {
  banner?: BannerSuperApp
  schedule?: EntrySchedule
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type FormValues = BannerSuperAppCreateInput | BannerSuperAppUpdateInput

export function BannerSuperAppFormDialog({
  banner,
  schedule,
  trigger,
  open,
  onOpenChange,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('banner_super_app')
  const tForm = useTranslations('banner_super_app.form')
  const tCommon = useTranslations('common')

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setOpen = isControlled ? onOpenChange! : setInternalOpen

  const isEdit = !!banner

  const form = useForm<FormValues>({
    resolver: zodResolver(
      isEdit ? BannerSuperAppUpdateSchema : BannerSuperAppCreateSchema,
    ),
    defaultValues: {
      name: banner?.name ?? '',
      url: banner?.url ?? '',
      position: banner?.position ?? 'block-1',
      order: banner?.order ?? 0,
      image: undefined,
      publishAt: schedule?.publishAt ? utcIsoToBrtLocal(schedule.publishAt) : '',
      unpublishAt: schedule?.unpublishAt
        ? utcIsoToBrtLocal(schedule.unpublishAt)
        : '',
    },
  })

  function onSubmit(values: FormValues, mode: 'draft' | 'publish') {
    startTransition(async () => {
      const saveResult = isEdit
        ? await updateBannerSuperAppAction(banner.id, values)
        : await createBannerSuperAppAction(values)

      if (!saveResult.ok) {
        toast.error(saveResult.error)
        return
      }

      const id = isEdit ? banner.id : saveResult.data?.id
      if (!id) {
        toast.error('ID inválido')
        return
      }

      // New items start as draft in Strapi — no unpublish call needed on create+draft
      const needsStatusChange = mode === 'publish' || isEdit

      if (needsStatusChange) {
        const pubResult =
          mode === 'publish'
            ? await publishBannerSuperAppAction(id)
            : await unpublishBannerSuperAppAction(id)

        if (!pubResult.ok) {
          toast.warning(pubResult.error)
        } else {
          toast.success(
            mode === 'publish'
              ? t('published')
              : t(isEdit ? 'updated' : 'created'),
          )
        }
      } else {
        toast.success(t('created'))
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
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tForm('imageLabel')}</FormLabel>
                  <FormControl>
                    <ImageInput
                      value={field.value as File | undefined}
                      onChange={field.onChange}
                      currentUrl={banner?.image.url}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>{tForm('imageHelp')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tForm('positionLabel')}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BANNER_SUPER_APP_POSITIONS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {t(`positions.${p}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tForm('nameLabel')}</FormLabel>
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
              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tForm('orderLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        disabled={isPending}
                        {...field}
                        value={field.value ?? 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tForm('urlLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder={tForm('urlPlaceholder')}
                      disabled={isPending}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
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
