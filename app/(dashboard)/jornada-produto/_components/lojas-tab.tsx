'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Search, Store, MapPin, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { LojaDisponivel } from '../page'

interface Props {
  lojas: LojaDisponivel[]
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function LojasTab({ lojas }: Props) {
  const t = useTranslations('jornadaProduto')
  const [query, setQuery] = useState('')

  const { filtered, groupedByRegiao, sortedRegioes } = useMemo(() => {
    const term = normalize(query.trim())
    const filtered = term
      ? lojas.filter((l) => {
          const haystack = normalize(
            [l.title, l.cidade, l.codLoja, l.regiao].filter(Boolean).join(' '),
          )
          return haystack.includes(term)
        })
      : lojas

    const groupedByRegiao = new Map<string, LojaDisponivel[]>()
    for (const loja of filtered) {
      const key = loja.regiao ?? '—'
      const list = groupedByRegiao.get(key) ?? []
      list.push(loja)
      groupedByRegiao.set(key, list)
    }
    const sortedRegioes = [...groupedByRegiao.keys()].sort((a, b) => {
      const na = Number(a)
      const nb = Number(b)
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb
      return a.localeCompare(b)
    })

    return { filtered, groupedByRegiao, sortedRegioes }
  }, [lojas, query])

  if (lojas.length === 0) {
    return (
      <p className="text-muted-foreground py-2 text-sm">{t('lojas.noLojas')}</p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('lojas.searchPlaceholder')}
            className="pl-8 pr-8"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
              onClick={() => setQuery('')}
              aria-label={t('lojas.clearSearch')}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
          {query
            ? t('lojas.filteredCount', {
                shown: filtered.length,
                total: lojas.length,
              })
            : t('lojas.count', { count: lojas.length })}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-2 text-sm">
          {t('lojas.noMatches', { q: query })}
        </p>
      ) : (
        <div className="space-y-3">
          {sortedRegioes.map((regiao) => {
            const lojasInRegiao = groupedByRegiao.get(regiao) ?? []
            return (
              <div
                key={regiao}
                className="border-border overflow-hidden rounded-lg border"
              >
                <div className="bg-muted/50 flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <MapPin className="size-3.5" />
                    {regiao === '—' ? (
                      t('lojas.semRegiao')
                    ) : (
                      <>
                        {t('lojas.regiao')}{' '}
                        <span className="font-mono">{regiao}</span>
                      </>
                    )}
                  </span>
                  <span className="text-muted-foreground">
                    {t('lojas.count', { count: lojasInRegiao.length })}
                  </span>
                </div>
                <div className="divide-border divide-y text-sm">
                  {lojasInRegiao.map((loja) => (
                    <div
                      key={loja.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-3 py-2"
                    >
                      <Store className="text-muted-foreground size-3.5 shrink-0" />
                      <span className="truncate font-medium">
                        {loja.title ?? '—'}
                      </span>
                      {loja.cidade && (
                        <span className="text-muted-foreground text-xs">
                          · {loja.cidade}
                        </span>
                      )}
                      {loja.codLoja && (
                        <span className="text-muted-foreground ml-auto font-mono text-xs">
                          #{loja.codLoja}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
