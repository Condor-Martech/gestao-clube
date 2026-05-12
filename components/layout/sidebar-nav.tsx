'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { NavSection } from '@/lib/navigation'
import { NavIcon } from './nav-icon'

interface SidebarNavProps {
  sections: NavSection[]
  onNavigate?: () => void
  collapsed?: boolean
}

export function SidebarNav({ sections, onNavigate, collapsed = false }: SidebarNavProps) {
  const pathname = usePathname()
  const tSections = useTranslations('nav.sections')
  const tItems = useTranslations('nav.items')

  return (
    <nav className="flex flex-col gap-6">
      {sections.map((section) => (
        <div key={section.titleKey} className="flex flex-col gap-1">
          {!collapsed && (
            <h2 className="text-muted-foreground px-3 text-xs font-semibold uppercase tracking-wider">
              {tSections(section.titleKey)}
            </h2>
          )}
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`)
              const label = tItems(item.labelKey)

              return (
                <li key={item.href}>
                  <Link
                    href={item.href as `/${string}`}
                    onClick={onNavigate}
                    title={collapsed ? label : undefined}
                    className={cn(
                      'flex items-center rounded-md py-2 text-sm font-medium transition-colors',
                      collapsed ? 'justify-center px-2' : 'gap-3 px-3',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <NavIcon
                      name={item.iconKey}
                      className={collapsed ? 'size-5' : 'size-4'}
                    />
                    {!collapsed && label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
