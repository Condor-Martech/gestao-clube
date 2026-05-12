'use client'

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateProdutoFieldsAction } from '../_actions'

type FieldName = 'nome' | 'descricao' | 'unidade' | 'order'

type FieldValue<F extends FieldName> = F extends 'order' ? number : string

const REQUIRED_TEXT_FIELDS = new Set<FieldName>(['nome', 'unidade'])

interface BaseProps<F extends FieldName> {
  produtoId: string
  field: F
  initialValue: FieldValue<F> | null
}

async function persist(
  produtoId: string,
  field: FieldName,
  value: string | number | null,
): Promise<{ ok: boolean; error?: string }> {
  const patch = { [field]: value } as Record<string, string | number | null>
  return updateProdutoFieldsAction(produtoId, patch)
}

function CellSpinner() {
  return <Loader2 className="text-muted-foreground size-3 shrink-0 animate-spin" />
}

interface EditableTextProps extends BaseProps<'nome' | 'descricao' | 'unidade'> {
  multiline?: boolean
  className?: string
  emptyLabel?: string
  canWrite?: boolean
}

export function EditableTextCell({
  produtoId,
  field,
  initialValue,
  multiline,
  className,
  emptyLabel = '—',
  canWrite = false,
}: EditableTextProps) {
  const [value, setValue] = useState<string>(initialValue ?? '')
  const [draft, setDraft] = useState<string>(value)
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
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
    if (draft === value) {
      setEditing(false)
      return
    }
    if (REQUIRED_TEXT_FIELDS.has(field) && draft.trim() === '') {
      toast.error(field === 'nome' ? 'Nome é obrigatório' : 'Unidade é obrigatória')
      setDraft(value)
      setEditing(false)
      return
    }
    const next = field === 'descricao' ? draft : draft.trim()
    startTransition(async () => {
      const payload = field === 'descricao' && next === '' ? null : next
      const result = await persist(produtoId, field, payload)
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

  function handleKey(e: KeyboardEvent<HTMLElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
    } else if (e.key === 'Enter' && !(multiline && e.shiftKey)) {
      e.preventDefault()
      commit()
    }
  }

  if (editing) {
    if (multiline) {
      return (
        <Textarea
          ref={inputRef as React.Ref<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKey}
          disabled={isPending}
          rows={2}
          className={cn('h-auto min-h-[40px] py-1 text-xs', className)}
        />
      )
    }
    return (
      <Input
        ref={inputRef as React.Ref<HTMLInputElement>}
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

interface EditableNumberProps extends BaseProps<'order'> {
  className?: string
  canWrite?: boolean
}

export function EditableNumberCell({
  produtoId,
  field,
  initialValue,
  className,
  canWrite = false,
}: EditableNumberProps) {
  const [value, setValue] = useState<number>(initialValue ?? 0)
  const [draft, setDraft] = useState<string>(String(value))
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const tc = useTranslations('common')

  useEffect(() => {
    setValue(initialValue ?? 0)
  }, [initialValue])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function startEdit() {
    if (isPending || !canWrite) return
    setDraft(String(value))
    setEditing(true)
  }

  function cancel() {
    setDraft(String(value))
    setEditing(false)
  }

  function commit() {
    const parsed = Number.parseInt(draft, 10)
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error('Ordem inválida')
      setDraft(String(value))
      setEditing(false)
      return
    }
    if (parsed === value) {
      setEditing(false)
      return
    }
    startTransition(async () => {
      const result = await persist(produtoId, field, parsed)
      if (!result.ok) {
        toast.error(result.error ?? 'Erro')
        setEditing(false)
        return
      }
      setValue(parsed)
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
        type="number"
        min={0}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
        disabled={isPending}
        className={cn('h-7 w-16 text-right text-sm tabular-nums', className)}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      disabled={isPending}
      className={cn(
        'group hover:bg-muted/60 -mx-1 flex w-full items-center justify-end gap-1 rounded px-1 py-1 text-right tabular-nums transition-colors',
        className,
      )}
      title="Clique para editar"
    >
      {isPending && <CellSpinner />}
      <span>{value}</span>
    </button>
  )
}

interface EditableSelectProps extends BaseProps<'unidade'> {
  options: readonly string[]
  className?: string
}

export function EditableSelectCell({
  produtoId,
  field,
  initialValue,
  options,
  className,
}: EditableSelectProps) {
  const [value, setValue] = useState<string>(initialValue ?? '')
  const [isPending, startTransition] = useTransition()
  const tc = useTranslations('common')

  useEffect(() => {
    setValue(initialValue ?? '')
  }, [initialValue])

  function handleChange(next: string) {
    if (next === value) return
    const previous = value
    setValue(next)
    startTransition(async () => {
      const result = await persist(produtoId, field, next)
      if (!result.ok) {
        toast.error(result.error ?? 'Erro')
        setValue(previous)
        return
      }
      toast.success(tc('saved'))
    })
  }

  return (
    <Select value={value || undefined} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger
        className={cn(
          'h-7 w-20 border-none bg-transparent px-2 shadow-none hover:bg-muted/60 focus:ring-1',
          className,
        )}
      >
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
