'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, X, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createAgrupamentoAction } from '../../../_actions'

export interface ProdutoOption {
  ean: string
  nome: string | null
  descricao: string | null
  unidade: string | null
  img_internal: string | null
  img_external: string | null
  host: string | null
}

interface Props {
  campanha: string
  produtos: ProdutoOption[]
}

const AUTOCOMPLETE_LIMIT = 10

export function AddAgrupamentoForm({ campanha, produtos }: Props) {
  const router = useRouter()
  const t = useTranslations('agrupamentos.form')
  const tc = useTranslations('common')

  const [pai, setPai] = useState<ProdutoOption | null>(null)
  const [itens, setItens] = useState<ProdutoOption[]>([])
  const [paiQuery, setPaiQuery] = useState('')
  const [paiOpen, setPaiOpen] = useState(false)
  const [itensQuery, setItensQuery] = useState('')
  const [saving, setSaving] = useState(false)

  const paiBoxRef = useRef<HTMLDivElement>(null)

  // Close pai autocomplete on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!paiBoxRef.current?.contains(e.target as Node)) {
        setPaiOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const paiSuggestions = useMemo(() => {
    const q = paiQuery.trim().toLowerCase()
    const list = q
      ? produtos.filter(
          (p) => p.ean.toLowerCase().includes(q) || (p.nome ?? '').toLowerCase().includes(q),
        )
      : produtos
    return list.slice(0, AUTOCOMPLETE_LIMIT)
  }, [paiQuery, produtos])

  const availableProdutos = useMemo(() => {
    const excluded = new Set<string>()
    if (pai) excluded.add(pai.ean)
    for (const item of itens) excluded.add(item.ean)

    const q = itensQuery.trim().toLowerCase()
    return produtos.filter((p) => {
      if (excluded.has(p.ean)) return false
      if (!q) return true
      return p.ean.toLowerCase().includes(q) || (p.nome ?? '').toLowerCase().includes(q)
    })
  }, [pai, itens, itensQuery, produtos])

  function selectPai(option: ProdutoOption) {
    setPai(option)
    setPaiQuery('')
    setPaiOpen(false)
  }

  function addItem(option: ProdutoOption) {
    setItens((prev) => (prev.some((i) => i.ean === option.ean) ? prev : [...prev, option]))
  }

  function removeItem(ean: string) {
    setItens((prev) => prev.filter((i) => i.ean !== ean))
  }

  function handlePaiKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && paiSuggestions[0]) {
      e.preventDefault()
      selectPai(paiSuggestions[0])
    }
    if (e.key === 'Escape') setPaiOpen(false)
  }

  async function handleSubmit() {
    if (!pai) {
      toast.error(t('paiRequired'))
      return
    }
    if (itens.length < 2) {
      toast.error(t('minItens'))
      return
    }

    // grupo = hosts únicos, primeiro elemento = host do pai (espelha o legacy orderGroup).
    const grupo = Array.from(
      new Set(
        [pai.host, ...itens.map((i) => i.host)]
          .map((h) => h?.trim())
          .filter((h): h is string => !!h),
      ),
    ).join(',')

    setSaving(true)
    const res = await createAgrupamentoAction({ ean: pai.ean, grupo, campanha })
    setSaving(false)

    if (!res.ok) {
      toast.error(res.error)
      return
    }

    toast.success(t('saved'))
    router.push(`/agrupamentos/${campanha}` as `/${string}`)
  }

  const canSave = !!pai && itens.length >= 2 && !saving

  return (
    <div className="space-y-4">
      <section className="border-border bg-card space-y-3 rounded-lg border p-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">{t('paiStepTitle')}</h2>
          <p className="text-muted-foreground text-xs">{t('paiStepDescription')}</p>
        </div>

        {pai ? (
          <div className="border-border bg-muted/40 flex items-center gap-3 rounded-md border p-2">
            <ProdutoThumb produto={pai} size={48} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="default">{t('paiBadge')}</Badge>
                <p className="truncate text-sm font-medium">{pai.nome ?? '—'}</p>
              </div>
              <p className="text-muted-foreground truncate font-mono text-xs">{pai.ean}</p>
            </div>
          </div>
        ) : (
          <div ref={paiBoxRef} className="relative">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                type="text"
                value={paiQuery}
                onChange={(e) => {
                  setPaiQuery(e.target.value)
                  setPaiOpen(true)
                }}
                onFocus={() => setPaiOpen(true)}
                onKeyDown={handlePaiKeyDown}
                placeholder={t('paiPlaceholder')}
                className="pl-9"
                autoComplete="off"
              />
            </div>
            {paiOpen && paiSuggestions.length > 0 && (
              <ul className="border-border bg-popover absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-md border shadow-md">
                {paiSuggestions.map((p) => (
                  <li key={p.ean}>
                    <button
                      type="button"
                      onClick={() => selectPai(p)}
                      className="hover:bg-accent flex w-full items-center gap-3 px-3 py-2 text-left"
                    >
                      <ProdutoThumb produto={p} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{p.nome ?? '—'}</p>
                        <p className="text-muted-foreground truncate font-mono text-xs">{p.ean}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {paiOpen && paiSuggestions.length === 0 && (
              <div className="border-border bg-popover text-muted-foreground absolute z-20 mt-1 w-full rounded-md border p-3 text-sm shadow-md">
                {t('noResults')}
              </div>
            )}
          </div>
        )}
      </section>

      {pai && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="border-border bg-card flex flex-col rounded-lg border">
            <div className="border-border space-y-2 border-b p-3">
              <h2 className="text-sm font-semibold">{t('availableTitle')}</h2>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  type="text"
                  value={itensQuery}
                  onChange={(e) => setItensQuery(e.target.value)}
                  placeholder={t('searchProduto')}
                  className="pl-9"
                  autoComplete="off"
                />
              </div>
            </div>
            <ul className="max-h-[520px] divide-y overflow-auto">
              {availableProdutos.length === 0 ? (
                <li className="text-muted-foreground p-6 text-center text-sm">{t('noResults')}</li>
              ) : (
                availableProdutos.map((p) => (
                  <li key={p.ean} className="hover:bg-accent/40 flex items-center gap-3 p-3">
                    <ProdutoThumb produto={p} size={48} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.nome ?? '—'}</p>
                      {p.unidade && (
                        <p className="text-muted-foreground truncate text-xs">{p.unidade}</p>
                      )}
                      <p className="text-muted-foreground truncate font-mono text-xs">{p.ean}</p>
                    </div>
                    <Button
                      type="button"
                      variant="default"
                      size="icon"
                      onClick={() => addItem(p)}
                      aria-label={t('add')}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="border-border bg-card flex flex-col rounded-lg border">
            <div className="border-border border-b p-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">{t('groupedTitle')}</h2>
                <Badge variant="secondary">
                  {itens.length} {itens.length === 1 ? 'item' : 'itens'}
                </Badge>
              </div>
            </div>
            <ul className="max-h-[520px] divide-y overflow-auto">
              <li className="bg-muted/30 flex items-center gap-3 p-3">
                <ProdutoThumb produto={pai} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{t('paiBadge')}</Badge>
                    <p className="truncate text-sm font-medium">{pai.nome ?? '—'}</p>
                  </div>
                  <p className="text-muted-foreground truncate font-mono text-xs">{pai.ean}</p>
                </div>
                <Check className="text-muted-foreground size-4" />
              </li>

              {itens.length === 0 ? (
                <li className="text-muted-foreground p-6 text-center text-sm">{t('emptyItens')}</li>
              ) : (
                itens.map((p) => (
                  <li key={p.ean} className="flex items-center gap-3 p-3">
                    <ProdutoThumb produto={p} size={48} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.nome ?? '—'}</p>
                      {p.unidade && (
                        <p className="text-muted-foreground truncate text-xs">{p.unidade}</p>
                      )}
                      <p className="text-muted-foreground truncate font-mono text-xs">{p.ean}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(p.ean)}
                      aria-label={t('remove')}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-4" />
                    </Button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/agrupamentos/${campanha}` as `/${string}`)}
        >
          {tc('cancel')}
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={!canSave}>
          {saving ? t('saving') : t('submit')}
        </Button>
      </div>
    </div>
  )
}

function ProdutoThumb({
  produto,
  size,
}: {
  produto: Pick<ProdutoOption, 'img_external' | 'img_internal' | 'nome'>
  size: number
}) {
  const img = produto.img_external ?? produto.img_internal
  return (
    <div
      className="bg-muted relative shrink-0 overflow-hidden rounded"
      style={{ width: size, height: size }}
    >
      {img ? (
        <Image
          src={img}
          alt={produto.nome ?? ''}
          fill
          sizes={`${size}px`}
          className="object-contain p-1"
        />
      ) : null}
    </div>
  )
}
