import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Role } from '@/lib/navigation'
import {
  type Module,
  type ModuleRoles,
  hasModuleAccess,
  canWrite,
} from '@/lib/rbac'

const VALID_ROLES: readonly Role[] = ['admin', 'manager', 'user']

function resolveRole(claim: unknown): Role {
  if (typeof claim === 'string' && VALID_ROLES.includes(claim as Role)) {
    return claim as Role
  }
  return 'user'
}

export interface SessionContext {
  email: string
  role: Role
  userId: string
  isAdmin: boolean
  moduleRoles: ModuleRoles
}

/**
 * Reads the session, queries profiles.role and users_system.module_roles.
 * Returns the full session context or redirects to /login.
 */
export async function requireSession(): Promise<SessionContext> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (!data?.claims) {
    redirect('/login')
  }

  const claims = data.claims as Record<string, unknown>
  const userId = (claims.sub as string | undefined) ?? ''
  const email = (claims.email as string | undefined) ?? ''

  const [{ data: profile }, { data: userSystem }] = await Promise.all([
    supabase.from('profiles').select('role').eq('user', userId).single(),
    supabase.from('users_system').select('module_roles').eq('id', userId).single(),
  ])

  const role = resolveRole(profile?.role)
  const moduleRoles = (userSystem?.module_roles ?? {}) as ModuleRoles

  return {
    email,
    role,
    userId,
    isAdmin: role === 'admin',
    moduleRoles,
  }
}

/**
 * Redirects to /dashboard if the user isn't admin.
 */
export async function requireAdmin(): Promise<SessionContext> {
  const session = await requireSession()
  if (!session.isAdmin) {
    redirect('/dashboard')
  }
  return session
}

/**
 * Redirects to /dashboard if the user cannot read the given module.
 */
export async function requireModuleRead(module: Module): Promise<SessionContext> {
  const session = await requireSession()
  if (!hasModuleAccess(session.isAdmin, module, session.moduleRoles)) {
    redirect('/dashboard')
  }
  return session
}

/**
 * Redirects to /dashboard if the user cannot write to the given module.
 * Use at the top of any Server Action that mutates data.
 */
export async function requireModuleWrite(module: Module): Promise<SessionContext> {
  const session = await requireSession()
  if (!canWrite(session.isAdmin, module, session.moduleRoles)) {
    redirect('/dashboard')
  }
  return session
}
