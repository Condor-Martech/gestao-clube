'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

const ALL_VALUE = '__all__'

interface Props {
  tipoOptions: string[]
  situacaoOptions: string[]
}

export function CampanhasFilters({ tipoOptions, situacaoOptions }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const t = useTranslations('campanhas.filters')
  const tc = useTranslations('common')
  const [, startTransition] = useTransition()

  const tipo = params.get('tipo') ?? ALL_VALUE
  const situacao = params.get('situacao') ?? ALL_VALUE
  const vigenciaFrom = params.get('vigencia_from') ?? ''
  const vigenciaTo = params.get('vigencia_to') ?? ''

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString())
    if (!value || value === ALL_VALUE) next.delete(key)
    else next.set(key, value)
    next.delete('page')
    startTransition(() => router.replace(`${pathname}?${next.toString()}`))
  }

  function clearAll() {
    const next = new URLSearchParams(params.toString())
    next.delete('tipo')
    next.delete('situacao')
    next.delete('vigencia_from')
    next.delete('vigencia_to')
    next.delete('page')
    const qs = next.toString()
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname))
  }

  const hasFilters =
    tipo !== ALL_VALUE || situacao !== ALL_VALUE || vigenciaFrom !== '' || vigenciaTo !== ''

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={situacao} onValueChange={(v) => updateParam('situacao', v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t('situacaoLabel')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{t('situacaoAll')}</SelectItem>
          {situacaoOptions.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1">
        <Label htmlFor="vigencia-from" className="text-muted-foreground text-xs whitespace-nowrap">
          {t('vigenciaFromLabel')}
        </Label>
        <Input
          id="vigencia-from"
          type="date"
          value={vigenciaFrom}
          onChange={(e) => updateParam('vigencia_from', e.target.value || null)}
          className="h-9 w-[150px]"
        />
      </div>

      <div className="flex items-center gap-1">
        <Label htmlFor="vigencia-to" className="text-muted-foreground text-xs whitespace-nowrap">
          {t('vigenciaToLabel')}
        </Label>
        <Input
          id="vigencia-to"
          type="date"
          value={vigenciaTo}
          onChange={(e) => updateParam('vigencia_to', e.target.value || null)}
          className="h-9 w-[150px]"
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          <X className="size-4" />
          {tc('clear')}
        </Button>
      )}
    </div>
  )
}
