'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireModuleWrite } from '@/lib/auth/guards'

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string }

export async function deleteTabloideAction(id: string): Promise<ActionResult> {
  await requireModuleWrite('operacionais')
  if (!id) return { ok: false, error: 'ID inválido' }

  const supabase = await createClient()
  const { error } = await supabase.from('Tabloides').delete().eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/tabloides')
  return { ok: true }
}
