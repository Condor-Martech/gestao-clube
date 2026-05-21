import type {
  BannerSuperApp,
  EntrySchedule,
  NumeroDaSorte,
  PublisherAction,
} from '@/types/entities'
import type { BannerSuperAppPosition } from '@/lib/validators/banner-super-app'

interface RawMedia {
  id?: number
  url?: string
  alternativeText?: string | null
  mime?: string
  size?: number
  name?: string
}

interface MediaWrapper {
  data?: { id?: number; attributes?: RawMedia } | null
}

type MaybeMedia = RawMedia | MediaWrapper | null | undefined

function pickMedia(field: MaybeMedia): RawMedia | null {
  if (field == null) return null
  if ('data' in field) {
    const inner = (field as MediaWrapper).data
    if (!inner) return null
    return inner.attributes ?? null
  }
  return field as RawMedia
}

function absoluteUrl(url: string, mediaBase: string): string {
  return url.startsWith('http') ? url : `${mediaBase}${url}`
}

interface BannerSuperAppRaw {
  id: number
  attributes?: BannerSuperAppAttrs
}
interface BannerSuperAppAttrs {
  name?: string | null
  slug: string
  url?: string | null
  position: BannerSuperAppPosition
  order?: number | null
  publishedAt?: string | null
  image?: MaybeMedia
}

export function mapBannerSuperApp(raw: unknown, mediaBase: string): BannerSuperApp {
  const r = raw as BannerSuperAppRaw & Partial<BannerSuperAppAttrs>
  const attrs: BannerSuperAppAttrs = r.attributes ?? (r as unknown as BannerSuperAppAttrs)
  const image = pickMedia(attrs.image)

  return {
    id: r.id,
    name: attrs.name ?? null,
    slug: attrs.slug,
    url: attrs.url ?? null,
    position: attrs.position,
    image: {
      url: image?.url ? absoluteUrl(image.url, mediaBase) : '',
      alt: image?.alternativeText ?? undefined,
    },
    order: attrs.order ?? 0,
    publishedAt: attrs.publishedAt ?? null,
  }
}

interface NumeroDaSorteRaw {
  id: number
  attributes?: NumeroDaSorteAttrs
}
interface NumeroDaSorteAttrs {
  Titulo?: string
  titulo?: string
  numeroCampanha: number | string
  Start?: string
  startDate?: string
  End?: string
  endDate?: string
  publishedAt?: string | null
  Banner?: MaybeMedia
  banner?: MaybeMedia
  banner_small?: MaybeMedia
  bannerSmall?: MaybeMedia
  Regulamento?: MaybeMedia
  regulamento?: MaybeMedia
}

interface PublisherActionRaw {
  id: number
  attributes?: {
    executeAt: string
    mode: 'publish' | 'unpublish'
    entityId: number
    entitySlug: string
  }
}

export function mapPublisherAction(raw: unknown): PublisherAction {
  const r = raw as PublisherActionRaw & Partial<NonNullable<PublisherActionRaw['attributes']>>
  const attrs = r.attributes ?? r
  return {
    id: r.id,
    executeAt: attrs.executeAt as string,
    mode: attrs.mode as 'publish' | 'unpublish',
    entityId: attrs.entityId as number,
    entitySlug: attrs.entitySlug as string,
  }
}

/**
 * Reduces a flat array of publisher actions into a per-entity schedule map.
 * If an entity has multiple actions of the same mode, the LATEST wins
 * (sorted by executeAt desc).
 */
export function buildScheduleMap(actions: PublisherAction[]): Record<number, EntrySchedule> {
  const map: Record<number, EntrySchedule> = {}
  for (const a of actions) {
    const slot = map[a.entityId] ?? {}
    if (a.mode === 'publish') {
      if (!slot.publishAt || slot.publishAt < a.executeAt) {
        slot.publishAt = a.executeAt
      }
    } else {
      if (!slot.unpublishAt || slot.unpublishAt < a.executeAt) {
        slot.unpublishAt = a.executeAt
      }
    }
    map[a.entityId] = slot
  }
  return map
}

export function mapNumeroDaSorte(raw: unknown, mediaBase: string): NumeroDaSorte {
  const r = raw as NumeroDaSorteRaw & Partial<NumeroDaSorteAttrs>
  const attrs: NumeroDaSorteAttrs = r.attributes ?? (r as unknown as NumeroDaSorteAttrs)

  const banner = pickMedia(attrs.Banner ?? attrs.banner)
  const bannerSmall = pickMedia(attrs.banner_small ?? attrs.bannerSmall)
  const regulamento = pickMedia(attrs.Regulamento ?? attrs.regulamento)

  return {
    id: r.id,
    titulo: attrs.Titulo ?? attrs.titulo ?? '',
    numeroCampanha:
      typeof attrs.numeroCampanha === 'string'
        ? Number(attrs.numeroCampanha)
        : attrs.numeroCampanha,
    startDate: attrs.Start ?? attrs.startDate ?? '',
    endDate: attrs.End ?? attrs.endDate ?? '',
    banner: {
      url: banner?.url ? absoluteUrl(banner.url, mediaBase) : '',
    },
    bannerSmall: bannerSmall?.url ? { url: absoluteUrl(bannerSmall.url, mediaBase) } : null,
    regulamento: {
      url: regulamento?.url ? absoluteUrl(regulamento.url, mediaBase) : '',
    },
    publishedAt: attrs.publishedAt ?? null,
  }
}
