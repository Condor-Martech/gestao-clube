import type { StrapiClient } from '../client'
import type { ActionResult } from '../types'
import { syncSchedule } from './schedule'
import type {
  NumeroDaSorteCreateInput,
  NumeroDaSorteUpdateInput,
} from '@/lib/validators/numero-da-sorte'

const COLLECTION = 'numero-da-sortes'
const ENTITY_SLUG = 'api::numero-da-sorte.numero-da-sorte'

interface NDSEntry {
  id: number
}

interface MediaIds {
  banner?: number
  bannerSmall?: number
  regulamento?: number
}

function buildPayload(
  input: NumeroDaSorteCreateInput | NumeroDaSorteUpdateInput,
  media: MediaIds,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    Titulo: input.titulo,
    numeroCampanha: input.numeroCampanha,
    Start: input.startDate,
    End: input.endDate,
  }
  if (media.banner !== undefined) payload.Banner = media.banner
  if (media.bannerSmall !== undefined) payload.banner_small = media.bannerSmall
  if (media.regulamento !== undefined) payload.Regulamento = media.regulamento
  return payload
}

export async function createNumeroDaSorte(
  client: StrapiClient,
  input: NumeroDaSorteCreateInput,
): Promise<ActionResult<{ id: number }>> {
  // Banner (required)
  const bannerUp = await client.upload(input.banner)
  if (!bannerUp.ok) return { ok: false, error: bannerUp.error }

  // banner_small (optional)
  let bannerSmallId: number | undefined
  if (input.bannerSmall) {
    const r = await client.upload(input.bannerSmall)
    if (!r.ok) return { ok: false, error: r.error }
    bannerSmallId = r.data.id
  }

  // Regulamento (required)
  const regUp = await client.upload(input.regulamento)
  if (!regUp.ok) return { ok: false, error: regUp.error }

  const create = await client.create<NDSEntry>(
    COLLECTION,
    buildPayload(input, {
      banner: bannerUp.data.id,
      bannerSmall: bannerSmallId,
      regulamento: regUp.data.id,
    }),
  )
  if (!create.ok) return { ok: false, error: create.error }

  if (input.publishAt || input.unpublishAt) {
    const sync = await syncSchedule(client, ENTITY_SLUG, create.data.id, {
      publishAt: input.publishAt,
      unpublishAt: input.unpublishAt,
    })
    if (!sync.ok) {
      return {
        ok: false,
        error: `Entrada criada mas agendamento falhou: ${sync.error}`,
      }
    }
  }

  return { ok: true, data: { id: create.data.id } }
}

export async function updateNumeroDaSorte(
  client: StrapiClient,
  id: number,
  input: NumeroDaSorteUpdateInput,
): Promise<ActionResult<{ id: number }>> {
  const media: MediaIds = {}

  if (input.banner) {
    const r = await client.upload(input.banner)
    if (!r.ok) return { ok: false, error: r.error }
    media.banner = r.data.id
  }
  if (input.bannerSmall) {
    const r = await client.upload(input.bannerSmall)
    if (!r.ok) return { ok: false, error: r.error }
    media.bannerSmall = r.data.id
  }
  if (input.regulamento) {
    const r = await client.upload(input.regulamento)
    if (!r.ok) return { ok: false, error: r.error }
    media.regulamento = r.data.id
  }

  const update = await client.update<NDSEntry>(COLLECTION, id, buildPayload(input, media))
  if (!update.ok) return { ok: false, error: update.error }

  // Always sync on update — covers create/update/delete of scheduled actions
  const sync = await syncSchedule(client, ENTITY_SLUG, id, {
    publishAt: input.publishAt,
    unpublishAt: input.unpublishAt,
  })
  if (!sync.ok) {
    return {
      ok: false,
      error: `Entrada atualizada mas agendamento falhou: ${sync.error}`,
    }
  }

  return { ok: true, data: { id: update.data.id } }
}

export async function deleteNumeroDaSorte(client: StrapiClient, id: number): Promise<ActionResult> {
  const r = await client.delete(COLLECTION, id)
  if (!r.ok) return { ok: false, error: r.error }
  return { ok: true }
}

export async function publishNumeroDaSorte(
  client: StrapiClient,
  id: number,
): Promise<ActionResult<{ id: number }>> {
  const r = await client.publish<NDSEntry>(COLLECTION, id)
  if (!r.ok) return { ok: false, error: r.error }
  return { ok: true, data: { id: r.data.id } }
}

export async function unpublishNumeroDaSorte(
  client: StrapiClient,
  id: number,
): Promise<ActionResult<{ id: number }>> {
  const r = await client.unpublish<NDSEntry>(COLLECTION, id)
  if (!r.ok) return { ok: false, error: r.error }
  return { ok: true, data: { id: r.data.id } }
}
