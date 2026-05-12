import type { StrapiClient } from '../client'
import type { ActionResult } from '../types'
import { mapPublisherAction } from '../mappers'
import { brtLocalToUtcIso } from '../schedule'

export interface ScheduleInput {
  /** BRT local datetime "YYYY-MM-DDTHH:MM"; "" or null/undefined = clear */
  publishAt?: string | null
  unpublishAt?: string | null
}

interface RawAction {
  id: number
  attributes: {
    executeAt: string
    mode: 'publish' | 'unpublish'
    entityId: number
    entitySlug: string
  }
}

/**
 * Reconciles desired vs existing publisher actions for a given entry.
 * - desired set + no existing → CREATE
 * - desired set + existing different → UPDATE
 * - desired empty + existing → DELETE
 * - desired empty + no existing → no-op
 */
export async function syncSchedule(
  client: StrapiClient,
  entitySlug: string,
  entityId: number,
  input: ScheduleInput,
): Promise<ActionResult> {
  const existingResult = await client.listPublisherActions<RawAction>({
    entitySlug,
    entityId,
  })
  if (!existingResult.ok) return { ok: false, error: existingResult.error }

  const existing = existingResult.data.map(mapPublisherAction)
  const byMode = {
    publish: existing.find((a) => a.mode === 'publish'),
    unpublish: existing.find((a) => a.mode === 'unpublish'),
  }

  for (const mode of ['publish', 'unpublish'] as const) {
    const localInput =
      mode === 'publish' ? input.publishAt : input.unpublishAt
    const desired = localInput ? brtLocalToUtcIso(localInput) : null
    const current = byMode[mode]

    if (desired && !current) {
      const r = await client.create('publisher/actions', {
        executeAt: desired,
        mode,
        entityId,
        entitySlug,
      })
      if (!r.ok) return { ok: false, error: r.error }
    } else if (desired && current && current.executeAt !== desired) {
      const r = await client.update('publisher/actions', current.id, {
        executeAt: desired,
      })
      if (!r.ok) return { ok: false, error: r.error }
    } else if (!desired && current) {
      const r = await client.delete('publisher/actions', current.id)
      if (!r.ok) return { ok: false, error: r.error }
    }
  }

  return { ok: true }
}
