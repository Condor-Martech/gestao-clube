import type { StrapiClient } from '../client'
import type { ActionResult } from '../types'
import { syncSchedule } from './schedule'
import type {
  BannerSuperAppCreateInput,
  BannerSuperAppUpdateInput,
} from '@/lib/validators/banner-super-app'

const COLLECTION = 'banner-super-apps'
const ENTITY_SLUG = 'api::banner-super-app.banner-super-app'

interface BannerEntry {
  id: number
}

function buildPayload(
  input: BannerSuperAppCreateInput | BannerSuperAppUpdateInput,
  imageId: number | undefined,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    position: input.position,
    order: input.order,
  }
  if (input.name) payload.name = input.name
  if (input.url) payload.url = input.url
  if (imageId !== undefined) payload.image = imageId
  return payload
}

export async function createBannerSuperApp(
  client: StrapiClient,
  input: BannerSuperAppCreateInput,
): Promise<ActionResult<{ id: number }>> {
  const upload = await client.upload(input.image)
  if (!upload.ok) return { ok: false, error: upload.error }

  const create = await client.create<BannerEntry>(
    COLLECTION,
    buildPayload(input, upload.data.id),
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
        error: `Banner criado mas agendamento falhou: ${sync.error}`,
      }
    }
  }

  return { ok: true, data: { id: create.data.id } }
}

export async function updateBannerSuperApp(
  client: StrapiClient,
  id: number,
  input: BannerSuperAppUpdateInput,
): Promise<ActionResult<{ id: number }>> {
  let imageId: number | undefined
  if (input.image) {
    const upload = await client.upload(input.image)
    if (!upload.ok) return { ok: false, error: upload.error }
    imageId = upload.data.id
  }

  const update = await client.update<BannerEntry>(
    COLLECTION,
    id,
    buildPayload(input, imageId),
  )
  if (!update.ok) return { ok: false, error: update.error }

  const sync = await syncSchedule(client, ENTITY_SLUG, id, {
    publishAt: input.publishAt,
    unpublishAt: input.unpublishAt,
  })
  if (!sync.ok) {
    return {
      ok: false,
      error: `Banner atualizado mas agendamento falhou: ${sync.error}`,
    }
  }

  return { ok: true, data: { id: update.data.id } }
}

export async function deleteBannerSuperApp(
  client: StrapiClient,
  id: number,
): Promise<ActionResult> {
  const r = await client.delete(COLLECTION, id)
  if (!r.ok) return { ok: false, error: r.error }
  return { ok: true }
}

export async function publishBannerSuperApp(
  client: StrapiClient,
  id: number,
): Promise<ActionResult<{ id: number }>> {
  const r = await client.publish<BannerEntry>(COLLECTION, id)
  if (!r.ok) return { ok: false, error: r.error }
  return { ok: true, data: { id: r.data.id } }
}

export async function unpublishBannerSuperApp(
  client: StrapiClient,
  id: number,
): Promise<ActionResult<{ id: number }>> {
  const r = await client.unpublish<BannerEntry>(COLLECTION, id)
  if (!r.ok) return { ok: false, error: r.error }
  return { ok: true, data: { id: r.data.id } }
}
