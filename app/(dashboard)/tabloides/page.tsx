import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { requireModuleRead } from '@/lib/auth/guards'
import { canWrite as computeCanWrite } from '@/lib/rbac'
import { pickString } from '@/lib/utils/search-params'
import { TabloidesSearch } from './_components/tabloides-search'
import { RegiaoFilter } from './_components/regiao-filter'
import { TabloideCard } from './_components/tabloide-card'
import type { Tabloide } from '@/types/entities'

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function escapeIlike(value: string) {
  return value.replace(/[%_]/g, (m) => `\\${m}`)
}

export default async function TabloidesPage({ searchParams }: Props) {
  const { isAdmin, moduleRoles } = await requireModuleRead('operacionais')
  const canDelete = computeCanWrite(isAdmin, 'operacionais', moduleRoles)
  const sp = await searchParams
  const t = await getTranslations('tabloides')
  const tc = await getTranslations('common')

  const q = pickString(sp.q)
  const regiao = pickString(sp.regiao)

  const supabase = await createClient()

  let listQuery = supabase
    .from('Tabloides')
    .select('id,name,regiao,"coverLink","minioLinks",uuid,created_at')
    .order('created_at', { ascending: false })
  if (q) listQuery = listQuery.ilike('name', `%${escapeIlike(q)}%`)
  if (regiao) listQuery = listQuery.eq('regiao', regiao)

  const regioesQuery = supabase
    .from('Tabloides')
    .select('regiao')
    .not('regiao', 'is', null)
    .order('regiao', { ascending: true })
    .limit(2000)

  const [{ data: listRows, error }, { data: regioesRows }] = await Promise.all([
    listQuery,
    regioesQuery,
  ])

  const tabloides = (listRows ?? []) as unknown as Tabloide[]
  const regioes = Array.from(
    new Set(
      (regioesRows ?? [])
        .map((r: { regiao: string | null }) => r.regiao)
        .filter(Boolean) as string[],
    ),
  )

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <TabloidesSearch />
        <RegiaoFilter regioes={regioes} />
      </div>

      <div className="text-muted-foreground text-xs">
        {t('totalCount', { count: tabloides.length })}
      </div>

      {error ? (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
          <p className="font-medium">{t('loadError')}</p>
          <p className="mt-1 text-xs opacity-80">{error.message}</p>
        </div>
      ) : tabloides.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
          {tc('noResults')}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {tabloides.map((tabloide) => (
            <TabloideCard key={tabloide.id} tabloide={tabloide} canDelete={canDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
