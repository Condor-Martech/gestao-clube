'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import {
  CampanhaSchema,
  CampanhaUpdateSchema,
  type CampanhaInput,
  type CampanhaUpdateInput,
} from '@/lib/validators/campanha'
import { createCampanhaAction, updateCampanhaAction } from '../_actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Campanha } from '@/types/entities'

type Mode = { mode: 'create' } | { mode: 'edit'; campanha: Campanha }

interface Props {
  variant: Mode
  onSuccess?: () => void
}

export function CampanhaForm({ variant, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()
  const tCommon = useTranslations('common')
  const tForm = useTranslations('campanhas.form')
  const tCamp = useTranslations('campanhas')

  const isEdit = variant.mode === 'edit'

  const form = useForm<CampanhaInput>({
    resolver: zodResolver(isEdit ? CampanhaUpdateSchema : CampanhaSchema),
    defaultValues: isEdit
      ? {
          cod_campanha: variant.campanha.cod_campanha,
          nom_campanha: variant.campanha.nom_campanha ?? '',
          dta_vigencia_inicio: variant.campanha.dta_vigencia_inicio ?? '',
          dta_vigencia_fim: variant.campanha.dta_vigencia_fim ?? '',
          dsc_tipo_campanha: variant.campanha.dsc_tipo_campanha ?? '',
          dsc_situacao: variant.campanha.dsc_situacao === 'Inativa' ? 'Inativa' : 'Ativa',
        }
      : {
          cod_campanha: '',
          nom_campanha: '',
          dta_vigencia_inicio: '',
          dta_vigencia_fim: '',
          dsc_tipo_campanha: '',
          dsc_situacao: 'Ativa',
        },
  })

  function onSubmit(values: CampanhaInput) {
    startTransition(async () => {
      const result = isEdit
        ? await updateCampanhaAction(variant.campanha.cod_campanha, values as CampanhaUpdateInput)
        : await createCampanhaAction(values)

      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(isEdit ? tCamp('updated') : tCamp('created'))
      form.reset()
      onSuccess?.()
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {!isEdit && (
          <FormField
            control={form.control}
            name="cod_campanha"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tForm('codLabel')}</FormLabel>
                <FormControl>
                  <Input disabled={isPending} {...field} />
                </FormControl>
                <FormDescription>{tForm('codHelp')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="nom_campanha"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tForm('nomLabel')}</FormLabel>
              <FormControl>
                <Input disabled={isPending} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dsc_tipo_campanha"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tForm('tipoLabel')}</FormLabel>
              <FormControl>
                <Input placeholder={tForm('tipoPlaceholder')} disabled={isPending} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="dta_vigencia_inicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tForm('inicioLabel')}</FormLabel>
                <FormControl>
                  <Input type="date" disabled={isPending} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dta_vigencia_fim"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tForm('fimLabel')}</FormLabel>
                <FormControl>
                  <Input type="date" disabled={isPending} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="dsc_situacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tForm('situacaoLabel')}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Ativa">Ativa</SelectItem>
                  <SelectItem value="Inativa">Inativa</SelectItem>
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
