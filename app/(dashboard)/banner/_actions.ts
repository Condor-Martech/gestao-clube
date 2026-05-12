'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/guards'
import { BannerSchema } from '@/lib/validators/banner'
import { uploadBannerAsset } from '@/lib/storage'

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string }

type CarouselField = 'carrosel' | 'carrosel2' | 'carrosel3'

export async function createBannerAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireAdmin()
  const parsed = BannerSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('Ofertas')
    .insert({
      ...parsed.data,
      video: parsed.data.video || null,
      regiao: parsed.data.regiao || null,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'Falha ao criar' }
  }

  revalidatePath('/banner')
  return { ok: true, data: { id: data.id as string } }
}

export async function updateBannerAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin()
  if (!id) return { ok: false, error: 'ID inválido' }

  const parsed = BannerSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('Ofertas')
    .update({
      ...parsed.data,
      video: parsed.data.video || null,
      regiao: parsed.data.regiao || null,
    })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/banner')
  return { ok: true }
}

export async function deleteBannerAction(id: string): Promise<ActionResult> {
  await requireAdmin()
  if (!id) return { ok: false, error: 'ID inválido' }

  const supabase = await createClient()
  const { error } = await supabase.from('Ofertas').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/banner')
  return { ok: true }
}

export async function uploadBannerImageAction(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  await requireAdmin()

  const id = formData.get('id')
  const field = formData.get('field')
  const file = formData.get('file')

  if (typeof id !== 'string' || !id) {
    return { ok: false, error: 'ID inválido' }
  }
  if (field !== 'carrosel' && field !== 'carrosel2' && field !== 'carrosel3') {
    return { ok: false, error: 'Campo inválido' }
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Arquivo inválido' }
  }

  const upload = await uploadBannerAsset(id, file)
  if (!upload.ok || !upload.url) {
    return { ok: false, error: upload.error ?? 'Falha ao enviar' }
  }

  const supabase = await createClient()

  // Read current array, append new URL.
  const { data: current } = await supabase
    .from('Ofertas')
    .select(field)
    .eq('id', id)
    .maybeSingle()

  const existing =
    (current as Record<string, string[] | null> | null)?.[field] ?? []
  const next = [...existing, upload.url]

  const { error } = await supabase
    .from('Ofertas')
    .update({ [field]: next })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/banner')
  return { ok: true, data: { url: upload.url } }
}

export async function removeBannerImageAction(
  id: string,
  field: CarouselField,
  url: string,
): Promise<ActionResult> {
  await requireAdmin()
  if (!id || !url) return { ok: false, error: 'Dados inválidos' }

  const supabase = await createClient()
  const { data: current } = await supabase
    .from('Ofertas')
    .select(field)
    .eq('id', id)
    .maybeSingle()

  const existing =
    (current as Record<string, string[] | null> | null)?.[field] ?? []
  const next = existing.filter((u) => u !== url)

  const { error } = await supabase
    .from('Ofertas')
    .update({ [field]: next })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/banner')
  return { ok: true }
}
