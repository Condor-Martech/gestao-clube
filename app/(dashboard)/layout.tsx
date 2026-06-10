import type { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { LogoutButton } from '@/components/layout/logout-button'
import { filterNavSections } from '@/lib/navigation'
import { requireSession } from '@/lib/auth/guards'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { email, isAdmin, moduleRoles } = await requireSession()
  const sections = filterNavSections(isAdmin, moduleRoles)

  return (
    <div className="bg-background flex h-svh overflow-hidden">
      <Sidebar isAdmin={isAdmin} moduleRoles={moduleRoles} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4 md:px-6">
          <div className="flex items-center gap-2">
            <MobileNav sections={sections} />
            <span className="text-muted-foreground hidden text-sm sm:inline">{email}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
