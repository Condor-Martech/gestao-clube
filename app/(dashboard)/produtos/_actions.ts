'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireModuleWrite } from '@/lib/auth/guards'
import {
  ProdutoUpdateSchema,
  ProdutoPartialUpdateSchema,
} from '@/lib/validators/produto'
import { uploadProdutoImage } from '@/lib/storage'

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string }

export async function updateProdutoAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  await requireModuleWrite('ofertas')
  const parsed = ProdutoUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('produto')
    .update(parsed.data)
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/produtos')
  return { ok: true }
}

export async function updateProdutoFieldsAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  await requireModuleWrite('ofertas')
  if (!id) return { ok: false, error: 'ID inválido' }

  const parsed = ProdutoPartialUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('produto')
    .update(parsed.data)
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/produtos')
  return { ok: true }
}

export async function approveProdutoAction(
  id: string,
  approve: boolean,
): Promise<ActionResult> {
  await requireModuleWrite('ofertas')
  if (!id) return { ok: false, error: 'ID inválido' }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const email = (claimsData?.claims?.email as string | undefined) ?? null

  const { error } = await supabase
    .from('produto')
    .update({
      aproved: approve,
      aproved_user: approve ? email : null,
      aproved_at: approve ? new Date().toISOString() : null,
    })
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/produtos')
  return { ok: true }
}

export async function uploadProdutoImageAction(
  formData: FormData,
): Promise<ActionResult<{ url: string; field: 'img_internal' | 'img_external' }>> {
  await requireModuleWrite('ofertas')
  const id = formData.get('id')
  const field = formData.get('field')
  const file = formData.get('file')

  if (typeof id !== 'string' || !id) {
    return { ok: false, error: 'ID inválido' }
  }
  if (field !== 'img_internal' && field !== 'img_external') {
    return { ok: false, error: 'Campo inválido' }
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Arquivo inválido' }
  }

  const upload = await uploadProdutoImage(id, file)
  if (!upload.ok || !upload.url) {
    return { ok: false, error: upload.error ?? 'Falha ao enviar' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('produto')
    .update({ [field]: upload.url })
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/produtos')
  return { ok: true, data: { url: upload.url, field } }
}
