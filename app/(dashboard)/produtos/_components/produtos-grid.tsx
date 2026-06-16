import { getTranslations } from 'next-intl/server'
import { ProdutoCard } from './produto-card'
import type { Produto } from '@/types/entities'

interface Props {
  produtos: Produto[]
  /** EANs that head an agrupamento in this campanha (flags the "pai" badge) */
  agrupamentoEans?: Set<string>
  /** Campaign code the agrupamento badge links to */
  campanhaCode?: string
  canWrite?: boolean
}

export async function ProdutosGrid({
  produtos,
  agrupamentoEans,
  campanhaCode,
  canWrite = false,
}: Props) {
  const tc = await getTranslations('common')

  if (produtos.length === 0) {
    return (
      <div className="border-border text-muted-foreground rounded-lg border p-12 text-center">
        {tc('noResults')}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {produtos.map((p) => (
        <ProdutoCard
          key={p.id}
          produto={p}
          hasAgrupamento={!!p.ean && !!agrupamentoEans?.has(p.ean)}
          campanhaCode={campanhaCode}
          canWrite={canWrite}
        />
      ))}
    </div>
  )
}
