import Link from 'next/link'
import { ChevronLeft, Layers } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { requireModuleRead } from '@/lib/auth/guards'
import { canWrite as computeCanWrite } from '@/lib/rbac'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AgrupamentosGrid } from './_components/agrupamentos-grid'
import type { Campanha, ProdutoNoAgrupamento } from '@/types/entities'

interface Props {
  params: Promise<{ code: string }>
}

export default async function AgrupamentosPage({ params }: Props) {
  const { isAdmin, moduleRoles } = await requireModuleRead('ofertas')
  const write = computeCanWrite(isAdmin, 'ofertas', moduleRoles)
  const { code } = await params
  const t = await getTranslations('agrupamentos')

  const supabase = await createClient()

  const { data: campanhaRaw } = await supabase
    .from('campanhas')
    .select('*')
    .eq('cod_campanha', code)
    .maybeSingle()

  if (!campanhaRaw) notFound()
  const campanha = campanhaRaw as unknown as Campanha

  const { data, error } = await supabase
    .from('produtos_no_agrupamento')
    .select('*')
    .eq('campanha', code)
    .order('agrupamento_order', { ascending: true, nullsFirst: false })
    .order('nome', { ascending: true })

  const produtos = (data ?? []) as unknown as ProdutoNoAgrupamento[]

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/campanhas">
          <ChevronLeft className="size-4" />
          {t('title')}
        </Link>
      </Button>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t('title')}
            </h1>
            {campanha.dsc_situacao && (
              <Badge variant={campanha.dsc_situacao === 'Ativa' ? 'success' : 'secondary'}>
                {campanha.dsc_situacao}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            {campanha.nom_campanha} · {produtos.length}{' '}
            {produtos.length === 1 ? 'produto' : 'produtos'}
          </p>
        </div>
        {write && (
          <Button asChild>
            <Link href={`/agrupamentos/new/${code}` as `/${string}`}>
              <Layers className="size-4" />
              {t('addButton')}
            </Link>
          </Button>
        )}
      </header>

      {error ? (
        <div className="text-destructive border-border rounded-lg border p-6 text-center">
          {error.message}
        </div>
      ) : (
        <AgrupamentosGrid produtos={produtos} canWrite={write} />
      )}
    </div>
  )
}
