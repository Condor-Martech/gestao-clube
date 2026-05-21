'use server'

import { revalidatePath } from 'next/cache'
import type { ZodError } from 'zod'
import { requireModuleWrite } from '@/lib/auth/guards'
import { env } from '@/lib/env'
import { createStrapiClient } from '@/lib/strapi/client'
import * as ops from '@/lib/strapi/operations/numero-da-sorte'
import type { ActionResult } from '@/lib/strapi/types'
import {
  NumeroDaSorteCreateSchema,
  NumeroDaSorteUpdateSchema,
} from '@/lib/validators/numero-da-sorte'

const ROUTE = '/numero-da-sorte'

function getClient() {
  return createStrapiClient({
    url: env.STRAPI_API_URL,
    token: env.STRAPI_API_TOKEN,
  })
}

function firstZodError(error: ZodError): string {
  return error.issues[0]?.message ?? 'Dados inválidos'
}

export async function createNumeroDaSorteAction(
  input: unknown,
): Promise<ActionResult<{ id: number }>> {
  await requireModuleWrite('conteudo')
  const parsed = NumeroDaSorteCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) }
  }
  const result = await ops.createNumeroDaSorte(getClient(), parsed.data)
  if (result.ok) revalidatePath(ROUTE)
  return result
}

export async function updateNumeroDaSorteAction(
  id: number,
  input: unknown,
): Promise<ActionResult<{ id: number }>> {
  await requireModuleWrite('conteudo')
  if (!id) return { ok: false, error: 'ID inválido' }
  const parsed = NumeroDaSorteUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) }
  }
  const result = await ops.updateNumeroDaSorte(getClient(), id, parsed.data)
  if (result.ok) revalidatePath(ROUTE)
  return result
}

export async function deleteNumeroDaSorteAction(id: number): Promise<ActionResult> {
  await requireModuleWrite('conteudo')
  if (!id) return { ok: false, error: 'ID inválido' }
  const result = await ops.deleteNumeroDaSorte(getClient(), id)
  if (result.ok) revalidatePath(ROUTE)
  return result
}

export async function publishNumeroDaSorteAction(
  id: number,
): Promise<ActionResult<{ id: number }>> {
  await requireModuleWrite('conteudo')
  if (!id) return { ok: false, error: 'ID inválido' }
  const result = await ops.publishNumeroDaSorte(getClient(), id)
  if (result.ok) revalidatePath(ROUTE)
  return result
}

export async function unpublishNumeroDaSorteAction(
  id: number,
): Promise<ActionResult<{ id: number }>> {
  await requireModuleWrite('conteudo')
  if (!id) return { ok: false, error: 'ID inválido' }
  const result = await ops.unpublishNumeroDaSorte(getClient(), id)
  if (result.ok) revalidatePath(ROUTE)
  return result
}
