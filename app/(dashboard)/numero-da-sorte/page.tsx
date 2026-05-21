import { getTranslations } from 'next-intl/server'
import { requireModuleRead } from '@/lib/auth/guards'
import { canWrite as computeCanWrite } from '@/lib/rbac'
import { PermissionGate } from '@/components/rbac/permission-gate'
import { env } from '@/lib/env'
import { createStrapiClient } from '@/lib/strapi/client'
import { buildScheduleMap, mapNumeroDaSorte, mapPublisherAction } from '@/lib/strapi/mappers'
import type { NumeroDaSorte } from '@/types/entities'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { parsePage, rangeFromPage, totalPages } from '@/lib/utils/pagination'
import { pickString } from '@/lib/utils/search-params'
import { NDSFormDialog } from './_components/nds-form-dialog'
import { NDSTable } from './_components/nds-table'

const ENTITY_SLUG = 'api::numero-da-sorte.numero-da-sorte'

interface Props {
  searchParams: Promise<{ page?: string | string[] }>
}

export default async function NumeroDaSortePage({ searchParams }: Props) {
  const { isAdmin, moduleRoles } = await requireModuleRead('conteudo')
  const write = computeCanWrite(isAdmin, 'conteudo', moduleRoles)
  const t = await getTranslations('numero_da_sorte')
  const sp = await searchParams
  const page = parsePage(pickString(sp.page))

  const client = createStrapiClient({
    url: env.STRAPI_API_URL,
    token: env.STRAPI_API_TOKEN,
  })

  const [entriesResult, actionsResult] = await Promise.all([
    client.list<unknown>('numero-da-sortes', {
      populate: '*',
      sort: 'Start:desc',
      'pagination[pageSize]': 100,
      publicationState: 'preview',
    }),
    client.listPublisherActions<unknown>({ entitySlug: ENTITY_SLUG }),
  ])

  const items: NumeroDaSorte[] = entriesResult.ok
    ? entriesResult.data.map((d) => mapNumeroDaSorte(d, env.STRAPI_API_URL))
    : []

  const schedules = actionsResult.ok
    ? buildScheduleMap(actionsResult.data.map(mapPublisherAction))
    : {}

  // Sort: published first (publishedAt !== null), then by start_date desc.
  // Within each group, latest start first.
  const sorted = [...items].sort((a, b) => {
    const aPublished = a.publishedAt !== null
    const bPublished = b.publishedAt !== null
    if (aPublished !== bPublished) return aPublished ? -1 : 1
    return b.startDate.localeCompare(a.startDate)
  })

  const PAGE_SIZE = 10
  const total = sorted.length
  const pages = totalPages(total, PAGE_SIZE)
  const { from, to } = rangeFromPage({ page, pageSize: PAGE_SIZE })
  const paged = sorted.slice(from, to + 1)

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        </div>
        <PermissionGate isAdmin={isAdmin} moduleRoles={moduleRoles} module="conteudo">
          <NDSFormDialog />
        </PermissionGate>
      </header>

      {!entriesResult.ok ? (
        <div className="text-destructive border-border rounded-lg border p-6 text-center">
          {entriesResult.error}
        </div>
      ) : (
        <NDSTable items={paged} schedules={schedules} canWrite={write} />
      )}

      {total > PAGE_SIZE && <PaginationControls page={page} totalPages={pages} />}
    </div>
  )
}
