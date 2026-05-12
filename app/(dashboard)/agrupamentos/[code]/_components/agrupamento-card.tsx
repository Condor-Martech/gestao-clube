'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { AgrupamentoDetailSheet } from './agrupamento-detail-sheet'
import type { ProdutoNoAgrupamento } from '@/types/entities'

interface Props {
  produto: ProdutoNoAgrupamento
  canWrite?: boolean
}

export function AgrupamentoCard({ produto, canWrite = false }: Props) {
  const t = useTranslations('agrupamentos')
  const [expanded, setExpanded] = useState(false)
  const img = produto.img_external ?? produto.img_internal
  const variant = [produto.unidade, produto.descricao]
    .filter((v): v is string => !!v && v.trim().length > 0)
    .join(' - ')

  return (
    <article className="border-border bg-card flex flex-col overflow-hidden rounded-xl border shadow-sm">
      <div className="bg-muted relative aspect-square w-full">
        {img ? (
          <Image
            src={img}
            alt={produto.nome ?? ''}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
            loading="lazy"
            className="object-contain p-3"
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
            sem imagem
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
          {produto.nome ?? '—'}
        </h3>
        {variant && (
          <p className="text-muted-foreground line-clamp-2 text-xs">
            {variant}
          </p>
        )}
        {produto.ean && (
          <p className="text-muted-foreground font-mono text-xs">
            {produto.ean}
          </p>
        )}

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-muted-foreground hover:text-foreground -mx-1 flex w-fit items-center gap-1 px-1 text-xs underline-offset-2 hover:underline"
        >
          {expanded ? (
            <>
              <ChevronUp className="size-3" />
              {t('viewLess')}
            </>
          ) : (
            <>
              <ChevronDown className="size-3" />
              {t('viewMore')}
            </>
          )}
        </button>

        {expanded && (
          <dl className="text-muted-foreground border-border space-y-1 border-t pt-2 text-xs">
            {produto.grupo && (
              <div className="space-y-0.5">
                <dt className="font-medium">{t('details.grupo')}</dt>
                <dd className="break-words">{produto.grupo}</dd>
              </div>
            )}
            {produto.pai && produto.pai !== produto.ean && (
              <div className="flex justify-between gap-2">
                <dt className="font-medium">{t('details.pai')}</dt>
                <dd className="font-mono break-all text-right">
                  {produto.pai}
                </dd>
              </div>
            )}
          </dl>
        )}

        <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
          <AgrupamentoDetailSheet
            pai={produto}
            trigger={
              <Button type="button" variant="default" size="sm">
                {t('viewButton')}
              </Button>
            }
          />
          {canWrite && (
            <Button type="button" variant="destructive" size="sm">
              {t('deleteButton')}
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
