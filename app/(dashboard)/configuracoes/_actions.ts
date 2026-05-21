'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireModuleWrite } from '@/lib/auth/guards'
import { AlertasConfigSchema } from '@/lib/validators/alertas-config'

type ActionResult = { ok: true } | { ok: false; error: string }

/**
 * Salva a configuração dos alertas de produtos sensíveis na linha única
 * `alertas_config` (id = 1). Gated a admin via o módulo `sistemas`.
 */
export async function saveAlertasConfigAction(
  input: unknown,
): Promise<ActionResult> {
  const session = await requireModuleWrite('sistemas')

  const parsed = AlertasConfigSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos',
    }
  }

  const { keywords, grupos, horasResumo, ativo } = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.from('alertas_config').upsert(
    {
      id: 1,
      keywords,
      grupos,
      horas_resumo: [...new Set(horasResumo)].sort((a, b) => a - b),
      ativo,
      updated_at: new Date().toISOString(),
      updated_by: session.userId,
    },
    { onConflict: 'id' },
  )

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/configuracoes')
  revalidatePath('/dashboard')
  return { ok: true }
}
