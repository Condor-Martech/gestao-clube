'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireModuleWrite } from '@/lib/auth/guards'
import {
  CampanhaSchema,
  CampanhaUpdateSchema,
} from '@/lib/validators/campanha'

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string }

export async function createCampanhaAction(input: unknown): Promise<ActionResult> {
  await requireModuleWrite('ofertas')
  const parsed = CampanhaSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('campanhas').insert(parsed.data)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/campanhas')
  return { ok: true }
}

export async function updateCampanhaAction(
  cod: string,
  input: unknown,
): Promise<ActionResult> {
  await requireModuleWrite('ofertas')
  const parsed = CampanhaUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('campanhas')
    .update(parsed.data)
    .eq('cod_campanha', cod)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/campanhas')
  revalidatePath(`/produtos/${cod}`)
  return { ok: true }
}

export async function deleteCampanhaAction(cod: string): Promise<ActionResult> {
  await requireModuleWrite('ofertas')
  if (!cod) return { ok: false, error: 'Código inválido' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('campanhas')
    .delete()
    .eq('cod_campanha', cod)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/campanhas')
  return { ok: true }
}
