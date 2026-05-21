'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import {
  AlertasConfigSchema,
  type AlertasConfigInput,
} from '@/lib/validators/alertas-config'
import { saveAlertasConfigAction } from '../_actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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

const HOURS = Array.from({ length: 24 }, (_, i) => i)

interface Props {
  config: AlertasConfigInput
}

export function AlertasConfigForm({ config }: Props) {
  const t = useTranslations('configuracoes')
  const tCommon = useTranslations('common')
  const [isPending, startTransition] = useTransition()
  const [keywordDraft, setKeywordDraft] = useState('')

  const form = useForm<AlertasConfigInput>({
    resolver: zodResolver(AlertasConfigSchema),
    defaultValues: {
      keywords: config.keywords,
      grupos: config.grupos,
      horasResumo: config.horasResumo,
      ativo: config.ativo,
    },
  })

  function onSubmit(values: AlertasConfigInput) {
    startTransition(async () => {
      const result = await saveAlertasConfigAction(values)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(t('saved'))
      form.reset(values)
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Status geral do alerta */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('statusTitle')}</CardTitle>
            <CardDescription>{t('statusDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>{t('ativoLabel')}</FormLabel>
                  <Select
                    value={field.value ? 'on' : 'off'}
                    onValueChange={(v) => field.onChange(v === 'on')}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="on">{t('ativoOn')}</SelectItem>
                      <SelectItem value="off">{t('ativoOff')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>{t('ativoHelp')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Detecção — palavras-chave */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('keywordsTitle')}</CardTitle>
            <CardDescription>{t('keywordsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => {
                const addKeyword = () => {
                  const kw = keywordDraft.trim().toLowerCase()
                  setKeywordDraft('')
                  if (!kw) return
                  if (field.value.some((k) => k.toLowerCase() === kw)) return
                  field.onChange([...field.value, kw])
                }
                return (
                  <FormItem>
                    <FormLabel>{t('keywordsLabel')}</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        value={keywordDraft}
                        onChange={(e) => setKeywordDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addKeyword()
                          }
                        }}
                        placeholder={t('keywordsPlaceholder')}
                        disabled={isPending}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={addKeyword}
                        disabled={isPending}
                      >
                        <Plus className="size-4" />
                        {t('add')}
                      </Button>
                    </div>
                    {field.value.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-3">
                        {field.value.map((kw) => (
                          <Badge
                            key={kw}
                            variant="secondary"
                            className="gap-1 pr-1"
                          >
                            {kw}
                            <button
                              type="button"
                              onClick={() =>
                                field.onChange(
                                  field.value.filter((k) => k !== kw),
                                )
                              }
                              disabled={isPending}
                              aria-label={t('removeItem')}
                              className="hover:bg-muted-foreground/20 rounded-sm p-0.5"
                            >
                              <X className="size-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <FormDescription>{t('keywordsHelp')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
          </CardContent>
        </Card>

        {/* Envio — grupos e horários */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('envioTitle')}</CardTitle>
            <CardDescription>{t('envioDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="grupos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('gruposLabel')}</FormLabel>
                  <FormDescription>{t('gruposHelp')}</FormDescription>
                  <div className="space-y-2 pt-1">
                    {field.value.length === 0 && (
                      <p className="text-muted-foreground text-sm">
                        {t('gruposEmpty')}
                      </p>
                    )}
                    {field.value.map((grupo, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={grupo.label}
                          onChange={(e) =>
                            field.onChange(
                              field.value.map((g, idx) =>
                                idx === i
                                  ? { ...g, label: e.target.value }
                                  : g,
                              ),
                            )
                          }
                          placeholder={t('grupoLabelPlaceholder')}
                          disabled={isPending}
                        />
                        <Input
                          value={grupo.jid}
                          onChange={(e) =>
                            field.onChange(
                              field.value.map((g, idx) =>
                                idx === i ? { ...g, jid: e.target.value } : g,
                              ),
                            )
                          }
                          placeholder={t('grupoJidPlaceholder')}
                          className="font-mono text-xs"
                          disabled={isPending}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            field.onChange(
                              field.value.filter((_, idx) => idx !== i),
                            )
                          }
                          disabled={isPending}
                          aria-label={t('removeItem')}
                          className="shrink-0"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        field.onChange([
                          ...field.value,
                          { jid: '', label: '' },
                        ])
                      }
                      disabled={isPending}
                    >
                      <Plus className="size-4" />
                      {t('addGrupo')}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="horasResumo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('horasLabel')}</FormLabel>
                  <FormDescription>{t('horasHelp')}</FormDescription>
                  <div className="grid grid-cols-6 gap-1.5 pt-1 sm:grid-cols-12">
                    {HOURS.map((h) => {
                      const selected = field.value.includes(h)
                      return (
                        <Button
                          key={h}
                          type="button"
                          variant={selected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() =>
                            field.onChange(
                              selected
                                ? field.value.filter((x) => x !== h)
                                : [...field.value, h],
                            )
                          }
                          disabled={isPending}
                          className="tabular-nums"
                        >
                          {String(h).padStart(2, '0')}
                        </Button>
                      )
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {tCommon('save')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
