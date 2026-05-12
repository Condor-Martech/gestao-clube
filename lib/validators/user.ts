import { z } from 'zod'
import { ASSIGNABLE_MODULES } from '@/lib/rbac'

export const USER_ROLES = ['admin', 'manager', 'user'] as const

const MODULE_LEVELS = ['user', 'manager'] as const

const ModuleRolesSchema = z
  .record(z.enum(ASSIGNABLE_MODULES as unknown as [string, ...string[]]), z.enum(MODULE_LEVELS))
  .default({})

export const InviteUserSchema = z.object({
  email: z.string().min(1, 'Email é obrigatório').email('Email inválido'),
  role: z.enum(USER_ROLES, { message: 'Role inválida' }),
  phone: z.string().max(30).optional().nullable(),
  module_roles: ModuleRolesSchema,
})

export type InviteUserInput = z.infer<typeof InviteUserSchema>

export const UpdateUserSchema = z.object({
  role: z.enum(USER_ROLES),
  status: z.boolean(),
  phone: z.string().max(30).optional().nullable(),
  module_roles: ModuleRolesSchema,
})

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
