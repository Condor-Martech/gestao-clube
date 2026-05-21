'use server'

import { revalidatePath } from 'next/cache'
import type { ZodError } from 'zod'
import { requireModuleWrite } from '@/lib/auth/guards'
import { env } from '@/lib/env'
import { createStrapiClient } from '@/lib/strapi/client'
import * as ops from '@/lib/strapi/operations/banner-super-app'
import type { ActionResult } from '@/lib/strapi/types'
import {
  BannerSuperAppCreateSchema,
  BannerSuperAppUpdateSchema,
} from '@/lib/validators/banner-super-app'

const ROUTE = '/banner-super-app'

function getClient() {
  return createStrapiClient({
    url: env.STRAPI_API_URL,
    token: env.STRAPI_API_TOKEN,
  })
}

function firstZodError(error: ZodError): string {
  return error.issues[0]?.message ?? 'Dados inválidos'
}

export async function createBannerSuperAppAction(
  input: unknown,
): Promise<ActionResult<{ id: number }>> {
  await requireModuleWrite('conteudo')
  const parsed = BannerSuperAppCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) }
  }
  const result = await ops.createBannerSuperApp(getClient(), parsed.data)
  if (result.ok) revalidatePath(ROUTE)
  return result
}

export async function updateBannerSuperAppAction(
  id: number,
  input: unknown,
): Promise<ActionResult<{ id: number }>> {
  await requireModuleWrite('conteudo')
  if (!id) return { ok: false, error: 'ID inválido' }
  const parsed = BannerSuperAppUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) }
  }
  const result = await ops.updateBannerSuperApp(getClient(), id, parsed.data)
  if (result.ok) revalidatePath(ROUTE)
  return result
}

export async function deleteBannerSuperAppAction(id: number): Promise<ActionResult> {
  await requireModuleWrite('conteudo')
  if (!id) return { ok: false, error: 'ID inválido' }
  const result = await ops.deleteBannerSuperApp(getClient(), id)
  if (result.ok) revalidatePath(ROUTE)
  return result
}

export async function publishBannerSuperAppAction(
  id: number,
): Promise<ActionResult<{ id: number }>> {
  await requireModuleWrite('conteudo')
  if (!id) return { ok: false, error: 'ID inválido' }
  const result = await ops.publishBannerSuperApp(getClient(), id)
  if (result.ok) revalidatePath(ROUTE)
  return result
}

export async function unpublishBannerSuperAppAction(
  id: number,
): Promise<ActionResult<{ id: number }>> {
  await requireModuleWrite('conteudo')
  if (!id) return { ok: false, error: 'ID inválido' }
  const result = await ops.unpublishBannerSuperApp(getClient(), id)
  if (result.ok) revalidatePath(ROUTE)
  return result
}
