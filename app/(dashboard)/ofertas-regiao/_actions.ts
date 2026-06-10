'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireModuleWrite } from '@/lib/auth/guards'
import { OfertaUpdateSchema } from '@/lib/validators/oferta'

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string }

export async function updateOfertaAction(id: string, input: unknown): Promise<ActionResult> {
  await requireModuleWrite('operacionais')
  if (!id) return { ok: false, error: 'ID inválido' }

  const parsed = OfertaUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('Ofertas').update(parsed.data).eq('id', id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/ofertas-regiao')
  return { ok: true }
}

export async function deleteOfertaAction(id: string): Promise<ActionResult> {
  await requireModuleWrite('operacionais')
  if (!id) return { ok: false, error: 'ID inválido' }

  const supabase = await createClient()
  const { error } = await supabase.from('Ofertas').delete().eq('id', id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/ofertas-regiao')
  return { ok: true }
}
