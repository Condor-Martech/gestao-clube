'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/guards'
import { generateAuthLink } from '@/lib/auth/email-links'
import { sendMail, inviteEmail } from '@/lib/mail'
import { InviteUserSchema, UpdateUserSchema } from '@/lib/validators/user'
import { env } from '@/lib/env'

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string }

export async function inviteUserAction(input: unknown): Promise<ActionResult> {
  await requireAdmin()

  const parsed = InviteUserSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos',
    }
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY não configurada' }
  }

  const admin = createAdminClient()

  // Generate the invite token (this creates the auth user) WITHOUT sending an
  // email — GoTrue's SMTP is bypassed; we deliver our own branded email below.
  const link = await generateAuthLink({
    admin,
    type: 'invite',
    email: parsed.data.email,
    data: { role: parsed.data.role },
  })

  if (!link.ok) {
    return { ok: false, error: link.error }
  }

  const userId = link.userId

  // Deliver the branded invite email. If it fails, roll back the auth user so
  // the admin can retry cleanly instead of leaving an orphan account behind.
  const invite = inviteEmail({ actionUrl: link.url })
  const sent = await sendMail({
    to: parsed.data.email,
    subject: invite.subject,
    html: invite.html,
    text: invite.text,
  })

  if (!sent.ok) {
    await admin.auth.admin.deleteUser(userId)
    return { ok: false, error: `Falha ao enviar o email de convite: ${sent.error}` }
  }

  // Create profile row with app role and status.
  const { error: profileError } = await admin.from('profiles').insert({
    user: userId,
    role: parsed.data.role,
    status: true,
  })

  if (profileError) {
    return { ok: false, error: profileError.message }
  }

  // Set phone on the auth user if provided.
  if (parsed.data.phone) {
    await admin.auth.admin.updateUserById(userId, { phone: parsed.data.phone })
  }

  // Persist module_roles in the dedicated table.
  const moduleRoles = parsed.data.role === 'admin' ? {} : (parsed.data.module_roles ?? {})
  const { error: mrError } = await admin
    .from('user_module_roles')
    .upsert({ user_id: userId, module_roles: moduleRoles }, { onConflict: 'user_id' })

  if (mrError) {
    return { ok: false, error: mrError.message }
  }

  revalidatePath('/users')
  return { ok: true }
}

export async function updateUserAction(id: string, input: unknown): Promise<ActionResult> {
  await requireAdmin()
  if (!id) return { ok: false, error: 'ID inválido' }

  const parsed = UpdateUserSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos',
    }
  }

  const supabase = await createClient()

  // Update role and status directly on profiles (users_system is a non-updatable view).
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: parsed.data.role, status: parsed.data.status })
    .eq('user', id)

  if (profileError) return { ok: false, error: profileError.message }

  // Update phone on the auth user via admin client.
  if (parsed.data.phone !== undefined) {
    const admin = createAdminClient()
    await admin.auth.admin.updateUserById(id, {
      phone: parsed.data.phone ?? undefined,
    })
  }

  // Upsert module_roles in the dedicated table.
  const moduleRoles = parsed.data.role === 'admin' ? {} : (parsed.data.module_roles ?? {})
  const { error: mrError } = await supabase
    .from('user_module_roles')
    .upsert({ user_id: id, module_roles: moduleRoles }, { onConflict: 'user_id' })

  if (mrError) return { ok: false, error: mrError.message }

  revalidatePath('/users')
  return { ok: true }
}
