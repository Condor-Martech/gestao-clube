import Image from 'next/image'
import { Check, Tag } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { ApproveButton } from './approve-button'
import { ProdutoEditDialog } from './produto-edit-dialog'
import { ProdutoSyncButton } from './produto-sync-button'
import { CopyEanButton } from './copy-ean-button'
import type { Produto } from '@/types/entities'

interface Props {
  produto: Produto
}

export async function ProdutoCard({ produto }: Props) {
  const t = await getTranslations('produtos')
  const img = produto.img_external ?? produto.img_internal
  const isApproved = !!produto.aproved
  const categoria = [produto.departamento, produto.setor]
    .filter((v): v is string => !!v)
    .join(' / ')

  return (
    <article className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
      <div className="bg-muted relative aspect-square w-full">
        {img ? (
          <Image
            src={img}
            alt={produto.nome ?? ''}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
            loading="lazy"
            className="object-contain p-3"
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
            sem imagem
          </div>
        )}

        {isApproved && (
          <div
            className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md"
            title={t('approved')}
            aria-label={t('approved')}
          >
            <Check className="size-4" strokeWidth={3} />
          </div>
        )}

        <ProdutoSyncButton
          campanhaCode={produto.campanha}
          className="absolute bottom-2 right-2 size-7"
        />
      </div>

      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 text-xs font-medium leading-snug">
          {produto.nome ?? '—'}
        </h3>
        {categoria && (
          <div
            className="text-muted-foreground flex items-start gap-1 text-[10px] leading-tight"
            title={categoria}
          >
            <Tag className="mt-0.5 size-3 shrink-0" />
            <span className="line-clamp-2">{categoria}</span>
          </div>
        )}
        {produto.ean && (
          <div className="text-muted-foreground flex items-center gap-1 font-mono text-[10px]">
            <span>{produto.ean}</span>
            <CopyEanButton ean={produto.ean} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1 border-t p-2">
        <ProdutoEditDialog
          produto={produto}
          trigger={
            <Button variant="outline" size="sm" className="h-7 w-full px-2 text-xs">
              {t('editButton')}
            </Button>
          }
        />
        <ApproveButton produtoId={produto.id} approved={isApproved} />
      </div>
    </article>
  )
}
