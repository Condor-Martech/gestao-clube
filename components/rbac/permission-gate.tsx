'use client'

import type { ReactNode } from 'react'
import type { Module, ModuleRoles } from '@/lib/rbac'
import { canWrite, hasModuleAccess } from '@/lib/rbac'

interface Props {
  isAdmin: boolean
  moduleRoles: ModuleRoles
  module: Module
  /** 'write' checks CUD permission; 'read' checks visibility. Default: 'write' */
  action?: 'read' | 'write'
  children: ReactNode
  /** Rendered when the user lacks permission. Default: null (renders nothing). */
  fallback?: ReactNode
}

export function PermissionGate({
  isAdmin,
  moduleRoles,
  module,
  action = 'write',
  children,
  fallback = null,
}: Props) {
  const allowed =
    action === 'write'
      ? canWrite(isAdmin, module, moduleRoles)
      : hasModuleAccess(isAdmin, module, moduleRoles)

  return allowed ? <>{children}</> : <>{fallback}</>
}
