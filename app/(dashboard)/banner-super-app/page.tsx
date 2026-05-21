import { getTranslations } from 'next-intl/server'
import { requireModuleRead } from '@/lib/auth/guards'
import { canWrite as computeCanWrite } from '@/lib/rbac'
import { PermissionGate } from '@/components/rbac/permission-gate'
import { env } from '@/lib/env'
import { createStrapiClient } from '@/lib/strapi/client'
import { buildScheduleMap, mapBannerSuperApp, mapPublisherAction } from '@/lib/strapi/mappers'
import { BANNER_SUPER_APP_POSITIONS } from '@/lib/validators/banner-super-app'
import type { BannerSuperApp } from '@/types/entities'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { parsePage, rangeFromPage, totalPages } from '@/lib/utils/pagination'
import { pickString } from '@/lib/utils/search-params'
import { BannerSuperAppFormDialog } from './_components/banner-super-app-form-dialog'
import { BannerSuperAppTable } from './_components/banner-super-app-table'

const ENTITY_SLUG = 'api::banner-super-app.banner-super-app'

interface Props {
  searchParams: Promise<{ page?: string | string[] }>
}

export default async function BannerSuperAppPage({ searchParams }: Props) {
  const { isAdmin, moduleRoles } = await requireModuleRead('conteudo')
  const write = computeCanWrite(isAdmin, 'conteudo', moduleRoles)
  const t = await getTranslations('banner_super_app')
  const sp = await searchParams
  const page = parsePage(pickString(sp.page))

  const client = createStrapiClient({
    url: env.STRAPI_API_URL,
    token: env.STRAPI_API_TOKEN,
  })

  const [result, actionsResult] = await Promise.all([
    client.list<unknown>('banner-super-apps', {
      populate: '*',
      sort: 'position:asc,order:asc',
      'pagination[pageSize]': 100,
      publicationState: 'preview',
    }),
    client.listPublisherActions<unknown>({ entitySlug: ENTITY_SLUG }),
  ])

  const banners: BannerSuperApp[] = result.ok
    ? result.data.map((item) => mapBannerSuperApp(item, env.STRAPI_API_URL))
    : []

  const schedules = actionsResult.ok
    ? buildScheduleMap(actionsResult.data.map(mapPublisherAction))
    : {}

  // Sort: by position (block-1..5), then order asc, then published first within group
  const positionRank = (p: BannerSuperApp['position']): number =>
    BANNER_SUPER_APP_POSITIONS.indexOf(p)

  const sorted = [...banners].sort((a, b) => {
    const posDiff = positionRank(a.position) - positionRank(b.position)
    if (posDiff !== 0) return posDiff
    if (a.order !== b.order) return a.order - b.order
    const aPublished = a.publishedAt !== null
    const bPublished = b.publishedAt !== null
    if (aPublished !== bPublished) return aPublished ? -1 : 1
    return 0
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
          <BannerSuperAppFormDialog />
        </PermissionGate>
      </header>

      {!result.ok ? (
        <div className="text-destructive border-border rounded-lg border p-6 text-center">
          {result.error}
        </div>
      ) : (
        <BannerSuperAppTable items={paged} schedules={schedules} canWrite={write} />
      )}

      {total > PAGE_SIZE && <PaginationControls page={page} totalPages={pages} />}
    </div>
  )
}
