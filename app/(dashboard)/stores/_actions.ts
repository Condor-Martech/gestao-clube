'use server'

import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/guards'
import { syncStores } from '@/lib/stores/sync-service'
import { SyncStoresInputSchema } from '@/lib/validators/store'
import type { Store } from '@/lib/stores/types'

export type SyncActionResult =
  | {
      ok: true
      results: Array<{
        store: Store
        throttled: boolean
        reviewsInserted: number
        error: string | null
      }>
    }
  | { ok: false; error: string }

export async function syncStoresAction(input: unknown): Promise<SyncActionResult> {
  await requireSession()

  const parsed = SyncStoresInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const { appId, store, force } = parsed.data
  const stores: Store[] = store ? [store] : ['play', 'app_store']

  const results = await Promise.all(
    stores.map((s) => syncStores({ appId, store: s, force })),
  )

  revalidatePath('/stores')

  return {
    ok: true,
    results: results.map((r) => ({
      store: r.store,
      throttled: r.throttled,
      reviewsInserted: r.reviewsInserted,
      error: r.error,
    })),
  }
}
