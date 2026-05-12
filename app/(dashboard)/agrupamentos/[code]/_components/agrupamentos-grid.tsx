import { getTranslations } from 'next-intl/server'
import { AgrupamentoCard } from './agrupamento-card'
import type { ProdutoNoAgrupamento } from '@/types/entities'

interface Props {
  produtos: ProdutoNoAgrupamento[]
  canWrite?: boolean
}

export async function AgrupamentosGrid({ produtos, canWrite = false }: Props) {
  const t = await getTranslations('agrupamentos')

  if (produtos.length === 0) {
    return (
      <div className="border-border text-muted-foreground rounded-lg border p-12 text-center">
        {t('empty')}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {produtos.map((p) => (
        <AgrupamentoCard key={p.id} produto={p} canWrite={canWrite} />
      ))}
    </div>
  )
}
