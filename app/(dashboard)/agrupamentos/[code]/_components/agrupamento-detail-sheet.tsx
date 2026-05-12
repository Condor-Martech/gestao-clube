'use client'

import Image from 'next/image'
import { useEffect, useState, type ReactNode } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ProdutoNoAgrupamento } from '@/types/entities'

interface Filho {
  ean: string
  nome: string | null
  unidade: string | null
  descricao: string | null
  img_external: string | null
  img_internal: string | null
  aproved: boolean | null
}

interface Props {
  pai: ProdutoNoAgrupamento
  trigger: ReactNode
}

export function AgrupamentoDetailSheet({ pai, trigger }: Props) {
  const t = useTranslations('agrupamentos.detail')
  const [open, setOpen] = useState(false)
  const [filhos, setFilhos] = useState<Filho[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !pai.ean || !pai.campanha) return

    let cancelled = false
    setLoading(true)
    const supabase = createClient()
    supabase
      .from('produto')
      .select(
        'ean,nome,unidade,descricao,img_external,img_internal,aproved',
      )
      .eq('pai', pai.ean)
      .eq('campanha', pai.campanha)
      .neq('ean', pai.ean)
      .order('nome', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return
        setFilhos((data ?? []) as unknown as Filho[])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, pai.ean, pai.campanha])

  const paiVariant = [pai.unidade, pai.descricao]
    .filter((v): v is string => !!v && v.trim().length > 0)
    .join(' - ')

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-md"
      >
        <header className="border-border space-y-1 border-b p-4">
          <h2 className="text-lg font-semibold">{t('title')}</h2>
          <p className="text-muted-foreground text-sm">{t('description')}</p>
        </header>

        <div className="flex-1 space-y-4 overflow-auto p-4">
          <div className="border-border bg-muted/30 rounded-lg border p-3">
            <div className="flex gap-3">
              <Thumb
                img={pai.img_external ?? pai.img_internal}
                alt={pai.nome ?? ''}
                size={64}
              />
              <div className="min-w-0 flex-1">
                <Badge className="mb-1">{t('paiBadge')}</Badge>
                <p className="truncate text-sm font-semibold">
                  {pai.nome ?? '—'}
                </p>
                {paiVariant && (
                  <p className="text-muted-foreground truncate text-xs">
                    {paiVariant}
                  </p>
                )}
                <p className="text-muted-foreground truncate font-mono text-xs">
                  {pai.ean}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              {t('filhosTitle')}
              {filhos !== null && (
                <span className="text-muted-foreground font-normal">
                  ({filhos.length})
                </span>
              )}
            </h3>

            {loading ? (
              <div className="text-muted-foreground flex justify-center py-8">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : filhos === null ? null : filhos.length === 0 ? (
              <div className="border-border text-muted-foreground rounded-lg border py-8 text-center text-sm">
                {t('noFilhos')}
              </div>
            ) : (
              <ul className="space-y-2">
                {filhos.map((f) => (
                  <li
                    key={f.ean}
                    className="border-border bg-card flex items-center gap-3 rounded-md border p-2"
                  >
                    <Thumb
                      img={f.img_external ?? f.img_internal}
                      alt={f.nome ?? ''}
                      size={44}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {f.nome ?? '—'}
                      </p>
                      {(f.unidade || f.descricao) && (
                        <p className="text-muted-foreground truncate text-xs">
                          {[f.unidade, f.descricao]
                            .filter(Boolean)
                            .join(' - ')}
                        </p>
                      )}
                      <p className="text-muted-foreground truncate font-mono text-xs">
                        {f.ean}
                      </p>
                    </div>
                    {f.aproved && (
                      <Badge variant="success" className="shrink-0">
                        {t('aproved')}
                      </Badge>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t('removeFilho')}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Thumb({
  img,
  alt,
  size,
}: {
  img: string | null
  alt: string
  size: number
}) {
  return (
    <div
      className="bg-muted relative shrink-0 overflow-hidden rounded"
      style={{ width: size, height: size }}
    >
      {img ? (
        <Image
          src={img}
          alt={alt}
          fill
          sizes={`${size}px`}
          className="object-contain p-1"
        />
      ) : null}
    </div>
  )
}
