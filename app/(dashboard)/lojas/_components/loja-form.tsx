'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import {
  LojaCreateSchema,
  type LojaCreateInput,
} from '@/lib/validators/loja'
import { createLojaAction } from '../_actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
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

interface Props {
  onSuccess?: () => void
}

export function LojaForm({ onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()
  const tCommon = useTranslations('common')
  const tForm = useTranslations('lojas.form')
  const tLojas = useTranslations('lojas')

  const form = useForm<LojaCreateInput>({
    resolver: zodResolver(LojaCreateSchema),
    defaultValues: {
      title: '',
      regiao: '',
      cidade: '',
      telefone: '',
      codLoja: '',
      status: true,
    },
  })

  function onSubmit(values: LojaCreateInput) {
    startTransition(async () => {
      const result = await createLojaAction(values)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(tLojas('created'))
      form.reset()
      onSuccess?.()
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tForm('titleLabel')}</FormLabel>
              <FormControl>
                <Input disabled={isPending} {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="regiao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tForm('regiaoLabel')}</FormLabel>
                <FormControl>
                  <Input disabled={isPending} {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tForm('cidadeLabel')}</FormLabel>
                <FormControl>
                  <Input disabled={isPending} {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tForm('telefoneLabel')}</FormLabel>
                <FormControl>
                  <Input disabled={isPending} {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="codLoja"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tForm('codLojaLabel')}</FormLabel>
                <FormControl>
                  <Input disabled={isPending} {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tForm('statusLabel')}</FormLabel>
              <Select
                value={field.value ? 'active' : 'inactive'}
                onValueChange={(v) => field.onChange(v === 'active')}
                disabled={isPending}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">{tForm('statusActiveOpt')}</SelectItem>
                  <SelectItem value="inactive">{tForm('statusInactiveOpt')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
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
