'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireModuleWrite } from '@/lib/auth/guards'
import { LojaCreateSchema, LojaPartialUpdateSchema } from '@/lib/validators/loja'

type ActionResult = { ok: true } | { ok: false; error: string }

export async function createLojaAction(input: unknown): Promise<ActionResult> {
  await requireModuleWrite('stores')
  const parsed = LojaCreateSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('Lojas').insert(parsed.data)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/lojas')
  return { ok: true }
}

export async function updateLojaFieldsAction(id: string, input: unknown): Promise<ActionResult> {
  await requireModuleWrite('stores')
  if (!id) return { ok: false, error: 'ID inválido' }

  const parsed = LojaPartialUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('Lojas').update(parsed.data).eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/lojas')
  return { ok: true }
}
