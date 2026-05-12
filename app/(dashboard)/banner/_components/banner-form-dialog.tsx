'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { BannerSchema, type BannerInput } from '@/lib/validators/banner'
import {
  createBannerAction,
  updateBannerAction,
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
import type { Oferta } from '@/types/entities'

interface Props {
  banner?: Oferta
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function BannerFormDialog({ banner, trigger, open, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const tForm = useTranslations('banner.form')
  const tBanner = useTranslations('banner')
  const tCommon = useTranslations('common')

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setOpen = isControlled ? onOpenChange! : setInternalOpen

  const isEdit = !!banner

  const form = useForm<BannerInput>({
    resolver: zodResolver(BannerSchema),
    defaultValues: {
      title: banner?.title ?? '',
      slug: banner?.slug ?? '',
      regiao: banner?.regiao ?? '',
      video: banner?.video ?? '',
    },
  })

  function onSubmit(values: BannerInput) {
    startTransition(async () => {
      const result = isEdit
        ? await updateBannerAction(banner.id, values)
        : await createBannerAction(values)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(isEdit ? tBanner('updated') : tBanner('created'))
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
            {tBanner('addButton')}
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? tForm('editTitle') : tForm('addTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? tForm('editDescription') : tForm('addDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tForm('slugLabel')}</FormLabel>
                  <FormControl>
                    <Input disabled={isPending} {...field} />
                  </FormControl>
                  <FormDescription>{tForm('slugHelp')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="regiao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tForm('regiaoLabel')}</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
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
      </DialogContent>
    </Dialog>
  )
}
