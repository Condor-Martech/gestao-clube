'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireModuleWrite } from '@/lib/auth/guards'
import {
  ApplyPipelineOrderSchema,
  PipelineUpdateSchema,
} from '@/lib/validators/pipeline'

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

export async function updatePipelineAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  await requireModuleWrite('ofertas')
  if (!id) return { ok: false, error: 'ID inválido' }

  const parsed = PipelineUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('pipelines')
    .update(parsed.data)
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/produtos/ordenar')
  return { ok: true }
}

export async function applyPipelineOrderAction(
  input: unknown,
): Promise<ActionResult<{ affected: number }>> {
  await requireModuleWrite('ofertas')
  const parsed = ApplyPipelineOrderSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos',
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('apply_pipeline_order', {
    eans: parsed.data.orderedEans,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/produtos')
  revalidatePath('/produtos/[code]', 'page')
  return { ok: true, data: { affected: typeof data === 'number' ? data : 0 } }
}
