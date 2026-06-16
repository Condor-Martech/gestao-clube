import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { requireModuleRead } from '@/lib/auth/guards'
import { Button } from '@/components/ui/button'
import { AddAgrupamentoForm } from './_components/add-agrupamento-form'
import type { Campanha } from '@/types/entities'

interface Props {
  params: Promise<{ code: string }>
}

export default async function NewAgrupamentoPage({ params }: Props) {
  await requireModuleRead('ofertas')
  const { code } = await params
  const t = await getTranslations('agrupamentos')

  const supabase = await createClient()

  const { data: campanhaRaw } = await supabase
    .from('campanhas')
    .select('cod_campanha,nom_campanha')
    .eq('cod_campanha', code)
    .maybeSingle()

  if (!campanhaRaw) notFound()
  const campanha = campanhaRaw as unknown as Pick<Campanha, 'cod_campanha' | 'nom_campanha'>

  const { data: produtos } = await supabase
    .from('produtos_pai')
    .select('ean,nome,descricao,unidade,img_internal,img_external,host')
    .eq('campanha', code)
    .not('ean', 'is', null)
    .or('aproved.is.null,aproved.eq.false')
    .order('nome', { ascending: true })

  const produtoOptions = (
    (produtos ?? []) as {
      ean: string
      nome: string | null
      descricao: string | null
      unidade: string | null
      img_internal: string | null
      img_external: string | null
      host: string | null
    }[]
  ).filter((p) => !!p.ean)

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/agrupamentos/${code}` as `/${string}`}>
          <ChevronLeft className="size-4" />
          {t('title')}
        </Link>
      </Button>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('addButton')}</h1>
        <p className="text-muted-foreground text-sm">
          {campanha.nom_campanha} · {produtoOptions.length}{' '}
          {produtoOptions.length === 1 ? 'produto' : 'produtos'}
        </p>
      </header>

      <AddAgrupamentoForm campanha={code} produtos={produtoOptions} />
    </div>
  )
}
