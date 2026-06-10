'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'
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
  const [closedSections, setClosedSections] = useState<Set<string>>(new Set())

  const toggleSection = (titleKey: string) => {
    setClosedSections((prev) => {
      const next = new Set(prev)
      if (next.has(titleKey)) next.delete(titleKey)
      else next.add(titleKey)
      return next
    })
  }

  return (
    <nav className="flex flex-col gap-6">
      {sections.map((section) => {
        const isOpen = collapsed || !closedSections.has(section.titleKey)
        const panelId = `nav-section-${section.titleKey}`

        const itemsList = (
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              const label = tItems(item.labelKey)

              return (
                <li key={item.href}>
                  <Link
                    href={item.href as `/${string}`}
                    onClick={onNavigate}
                    title={collapsed ? label : undefined}
                    tabIndex={isOpen ? 0 : -1}
                    className={cn(
                      'flex items-center rounded-md py-2 text-sm font-medium transition-colors',
                      collapsed ? 'justify-center px-2' : 'gap-3 px-3',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    <NavIcon name={item.iconKey} className={collapsed ? 'size-5' : 'size-4'} />
                    {!collapsed && label}
                  </Link>
                </li>
              )
            })}
          </ul>
        )

        return (
          <div key={section.titleKey} className="flex flex-col gap-1">
            {!collapsed && (
              <button
                type="button"
                onClick={() => toggleSection(section.titleKey)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between rounded-md px-3 py-1 text-xs font-semibold tracking-wider uppercase transition-colors"
              >
                <span>{tSections(section.titleKey)}</span>
                <ChevronDown
                  className={cn(
                    'size-3.5 transition-transform duration-200',
                    isOpen ? 'rotate-0' : '-rotate-90',
                  )}
                />
              </button>
            )}
            {collapsed ? (
              itemsList
            ) : (
              <div
                id={panelId}
                className={cn(
                  'grid transition-[grid-template-rows] duration-200 ease-in-out',
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
              >
                <div className="overflow-hidden">{itemsList}</div>
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
