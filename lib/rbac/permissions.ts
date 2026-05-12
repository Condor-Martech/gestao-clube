import type { Module, ModuleRoles } from './constants'

/**
 * Can the user see/access a module at all?
 * - admin (isAdmin=true): always true
 * - sistemas: always false for non-admins, even if present in moduleRoles
 * - others: true only if the module appears in moduleRoles
 */
export function hasModuleAccess(
  isAdmin: boolean,
  module: Module,
  moduleRoles: ModuleRoles,
): boolean {
  if (isAdmin) return true
  if (module === 'sistemas') return false
  return module in moduleRoles
}

/**
 * Can the user perform write operations (create / update / delete)?
 * - admin: always true
 * - user-level module assignment: always false
 * - manager-level module assignment: true
 */
export function canWrite(
  isAdmin: boolean,
  module: Module,
  moduleRoles: ModuleRoles,
): boolean {
  if (isAdmin) return true
  if (module === 'sistemas') return false
  return moduleRoles[module] === 'manager'
}
