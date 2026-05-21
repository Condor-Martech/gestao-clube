'use client'

import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { updateLojaFieldsAction } from '../_actions'

type TextField = 'title' | 'regiao' | 'cidade' | 'telefone' | 'codLoja'

const REQUIRED_FIELDS = new Set<TextField>(['title'])

interface EditableTextCellProps {
  lojaId: string
  field: TextField
  initialValue: string | null
  className?: string
  emptyLabel?: string
  canWrite?: boolean
}

function CellSpinner() {
  return <Loader2 className="text-muted-foreground size-3 shrink-0 animate-spin" />
}

export function EditableTextCell({
  lojaId,
  field,
  initialValue,
  className,
  emptyLabel = '—',
  canWrite = false,
}: EditableTextCellProps) {
  const [value, setValue] = useState<string>(initialValue ?? '')
  const [draft, setDraft] = useState<string>(value)
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const tc = useTranslations('common')

  useEffect(() => {
    setValue(initialValue ?? '')
  }, [initialValue])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function startEdit() {
    if (isPending || !canWrite) return
    setDraft(value)
    setEditing(true)
  }

  function cancel() {
    setDraft(value)
    setEditing(false)
  }

  function commit() {
    const next = draft.trim()
    if (next === value) {
      setEditing(false)
      return
    }
    if (REQUIRED_FIELDS.has(field) && next === '') {
      toast.error('Nome é obrigatório')
      setDraft(value)
      setEditing(false)
      return
    }
    startTransition(async () => {
      const payload = field === 'title' ? next : next === '' ? null : next
      const result = await updateLojaFieldsAction(lojaId, { [field]: payload })
      if (!result.ok) {
        toast.error(result.error ?? 'Erro')
        setEditing(false)
        return
      }
      setValue(next)
      setEditing(false)
      toast.success(tc('saved'))
    })
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    }
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
        disabled={isPending}
        className={cn('h-7 text-sm', className)}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      disabled={isPending}
      className={cn(
        'group hover:bg-muted/60 -mx-1 flex w-full items-center gap-1 rounded px-1 py-1 text-left transition-colors',
        className,
      )}
      title="Clique para editar"
    >
      <span className={cn('flex-1 truncate', !value && 'text-muted-foreground')}>
        {value || emptyLabel}
      </span>
      {isPending && <CellSpinner />}
    </button>
  )
}

interface EditableStatusCellProps {
  lojaId: string
  initialValue: boolean | null
  canWrite?: boolean
}

export function EditableStatusCell({
  lojaId,
  initialValue,
  canWrite = false,
}: EditableStatusCellProps) {
  const [value, setValue] = useState<boolean>(Boolean(initialValue))
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('lojas')
  const tc = useTranslations('common')

  useEffect(() => {
    setValue(Boolean(initialValue))
  }, [initialValue])

  function toggle() {
    if (isPending || !canWrite) return
    const next = !value
    const previous = value
    setValue(next)
    startTransition(async () => {
      const result = await updateLojaFieldsAction(lojaId, { status: next })
      if (!result.ok) {
        toast.error(result.error ?? 'Erro')
        setValue(previous)
        return
      }
      toast.success(tc('saved'))
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded transition-opacity hover:opacity-80 disabled:opacity-60"
      title="Clique para alternar"
    >
      <Badge variant={value ? 'success' : 'secondary'}>
        {value ? t('statusActive') : t('statusInactive')}
      </Badge>
      {isPending && <CellSpinner />}
    </button>
  )
}
