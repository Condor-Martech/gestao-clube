'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireModuleWrite } from '@/lib/auth/guards'
import { AgrupamentoSchema } from '@/lib/validators/agrupamento'

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string }

export async function createAgrupamentoAction(input: unknown): Promise<ActionResult> {
  const session = await requireModuleWrite('ofertas')
  const parsed = AgrupamentoSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos',
    }
  }

  const supabase = await createClient()

  // Replica a linha que o legacy grava: ean do pai + grupo (lista de hosts),
  // user = UID, user_at ISO. host/order/itens ficam null.
  const payload = {
    ean: parsed.data.ean,
    grupo: parsed.data.grupo,
    campanha: parsed.data.campanha,
    user: session.userId,
    user_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('agrupamento').insert(payload)

  if (error) {
    return { ok: false, error: error.message }
  }

  await supabase.from('logs').insert({
    event_name: 'criar_agrupamento',
    user: session.userId,
    module: 'ofertas',
    payload: {
      grupo: parsed.data.grupo,
      pai: parsed.data.ean,
      campanha: parsed.data.campanha,
    },
  })

  revalidatePath(`/agrupamentos/${parsed.data.campanha}`)
  return { ok: true }
}

export async function deleteAgrupamentoAction(ean: string, campanha: string): Promise<ActionResult> {
  const session = await requireModuleWrite('ofertas')
  if (!ean) return { ok: false, error: 'EAN inválido' }

  const supabase = await createClient()

  // Lê o grupo antes de apagar, para registrar no log (espelha o legacy).
  const { data: existing } = await supabase
    .from('agrupamento')
    .select('grupo')
    .eq('ean', ean)
    .eq('campanha', campanha)
    .maybeSingle()

  const { error } = await supabase
    .from('agrupamento')
    .delete()
    .eq('ean', ean)
    .eq('campanha', campanha)

  if (error) {
    return { ok: false, error: error.message }
  }

  await supabase.from('logs').insert({
    event_name: 'apagar_agrupamento',
    user: session.userId,
    module: 'ofertas',
    payload: {
      grupo: (existing as { grupo: string | null } | null)?.grupo ?? null,
      pai: ean,
      campanha,
    },
  })

  revalidatePath(`/agrupamentos/${campanha}`)
  return { ok: true }
}
