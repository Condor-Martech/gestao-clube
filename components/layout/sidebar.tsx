import { getTranslations } from 'next-intl/server'
import { filterNavSections } from '@/lib/navigation'
import { type ModuleRoles } from '@/lib/rbac'
import { SidebarClient } from './sidebar-client'

interface SidebarProps {
  isAdmin: boolean
  moduleRoles: ModuleRoles
}

export async function Sidebar({ isAdmin, moduleRoles }: SidebarProps) {
  const t = await getTranslations('app')
  const sections = filterNavSections(isAdmin, moduleRoles)

  return <SidebarClient title={t('title')} sections={sections} />
}
