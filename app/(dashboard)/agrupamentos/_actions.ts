'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireModuleWrite } from '@/lib/auth/guards'
import { AgrupamentoSchema } from '@/lib/validators/agrupamento'

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string }

export async function createAgrupamentoAction(
  input: unknown,
): Promise<ActionResult> {
  await requireModuleWrite('ofertas')
  const parsed = AgrupamentoSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos',
    }
  }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const email = (claimsData?.claims?.email as string | undefined) ?? null

  const payload = {
    ...parsed.data,
    user: email,
    userAt: new Date().toISOString(),
  }

  const { error } = await supabase.from('Agrupamentos').insert(payload)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath(`/agrupamentos/${parsed.data.campanha}`)
  return { ok: true }
}

export async function deleteAgrupamentoAction(
  id: string,
  campanha: string,
): Promise<ActionResult> {
  await requireModuleWrite('ofertas')
  if (!id) return { ok: false, error: 'ID inválido' }

  const supabase = await createClient()
  const { error } = await supabase.from('Agrupamentos').delete().eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath(`/agrupamentos/${campanha}`)
  return { ok: true }
}
