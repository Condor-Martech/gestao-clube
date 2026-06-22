'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import type { Produto } from '@/types/entities'
import { ProdutosTable } from './produtos-table'
import { ProdutosGrid } from './produtos-grid'

interface Props {
  campanhaCode: string
  view: 'list' | 'grid'
  pageSize: number
  search?: string
  approved?: string
  sortColumn: string
  sortAscending: boolean
  canWrite: boolean
  /** Serialized Set — reconstructed client-side to flag the "pai" badge */
  agrupamentoEans: string[]
}

export function ProdutosInfiniteList({
  campanhaCode,
  view,
  pageSize,
  search,
  approved,
  sortColumn,
  sortAscending,
  canWrite,
  agrupamentoEans,
}: Props) {
  const tc = useTranslations('common')
  const eans = useMemo(() => new Set(agrupamentoEans), [agrupamentoEans])

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['produtos', campanhaCode, view, pageSize, search ?? '', approved ?? '', sortColumn, sortAscending],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const supabase = createClient()
      const from = (pageParam - 1) * pageSize
      const to = from + pageSize - 1
      let query = supabase
        .from('produtos_pai')
        .select('*', { count: 'exact' })
        .eq('campanha', campanhaCode)
        .order(sortColumn, { ascending: sortAscending, nullsFirst: false })
        // Stable tiebreaker: `order`/`nome`/etc. have ties, so without a unique
        // secondary key a row can straddle two page boundaries and load twice.
        .order('id', { ascending: true })
        .range(from, to)

      if (search) {
        query = query.or(
          `nome.ilike.%${search}%,ean.ilike.%${search}%,departamento.ilike.%${search}%,setor.ilike.%${search}%`,
        )
      }
      if (approved === 'yes') query = query.eq('aproved', true)
      if (approved === 'no') query = query.eq('aproved', false)

      const { data, count, error } = await query
      if (error) throw new Error(error.message)
      return { rows: (data ?? []) as unknown as Produto[], count: count ?? 0 }
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((n, p) => n + p.rows.length, 0)
      return loaded < lastPage.count ? allPages.length + 1 : undefined
    },
  })

  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '400px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex justify-center p-12">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-destructive border-border rounded-lg border p-6 text-center">
        {error instanceof Error ? error.message : tc('error')}
      </div>
    )
  }

  const produtos = data?.pages.flatMap((p) => p.rows) ?? []

  return (
    <div className="space-y-4">
      {view === 'grid' ? (
        <ProdutosGrid produtos={produtos} agrupamentoEans={eans} campanhaCode={campanhaCode} />
      ) : (
        <ProdutosTable
          produtos={produtos}
          showCampanha={false}
          showDetails={false}
          canWrite={canWrite}
          agrupamentoEans={eans}
          campanhaCode={campanhaCode}
        />
      )}

      <div ref={sentinelRef} aria-hidden className="h-px" />

      {isFetchingNextPage && (
        <div className="text-muted-foreground flex justify-center p-4">
          <Loader2 className="size-5 animate-spin" />
        </div>
      )}
    </div>
  )
}
