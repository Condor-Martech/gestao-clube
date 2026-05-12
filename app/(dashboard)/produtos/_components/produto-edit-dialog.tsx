'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import {
  ProdutoUpdateSchema,
  type ProdutoUpdateInput,
} from '@/lib/validators/produto'
import { updateProdutoAction } from '../_actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ProdutoImageUpload } from './produto-image-upload'
import type { Produto } from '@/types/entities'

interface Props {
  produto: Produto
  trigger?: ReactNode
}

export function ProdutoEditDialog({ produto, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('produtos.form')
  const tc = useTranslations('common')
  const tImg = useTranslations('produtos.imageUpload')

  const form = useForm<ProdutoUpdateInput>({
    resolver: zodResolver(ProdutoUpdateSchema),
    defaultValues: {
      nome: produto.nome ?? '',
      descricao: produto.descricao ?? '',
      ean: produto.ean ?? '',
      unidade: produto.unidade ?? 'UN',
      order: produto.order ?? 0,
      eletro: produto.eletro ?? false,
    },
  })

  function onSubmit(values: ProdutoUpdateInput) {
    startTransition(async () => {
      const result = await updateProdutoAction(produto.id, values)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(tc('saved'))
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon">
            <Pencil className="size-4" />
            <span className="sr-only">{tc('edit')}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('editTitle')}</DialogTitle>
          <DialogDescription>{t('editDescription')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="produto-edit-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('nomeLabel')}</FormLabel>
                  <FormControl>
                    <Input disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('descricaoLabel')}</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={isPending}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <FormField
                control={form.control}
                name="ean"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('eanLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        readOnly
                        tabIndex={-1}
                        className="bg-muted/50 cursor-not-allowed"
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
                name="unidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('unidadeLabel')}</FormLabel>
                    <FormControl>
                      <Input disabled={isPending} {...field} />
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
                    <FormLabel>{t('orderLabel')}</FormLabel>
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
          </form>
        </Form>

        <div className="space-y-4 border-t pt-4">
          <ProdutoImageUpload
            produtoId={produto.id}
            field="img_external"
            currentUrl={produto.img_external}
            label={tImg('label')}
          />
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            {tc('cancel')}
          </Button>
          <Button type="submit" form="produto-edit-form" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {tc('save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
