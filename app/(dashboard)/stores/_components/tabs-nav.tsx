'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export interface TabItem {
  href: string
  label: string
}

export function TabsNav({ tabs }: { tabs: TabItem[] }) {
  const pathname = usePathname()
  return (
    <nav
      role="tablist"
      className="bg-muted text-muted-foreground inline-flex h-9 items-center justify-center rounded-lg p-1"
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={active}
            className={cn(
              'ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              active
                ? 'bg-background text-foreground shadow'
                : 'hover:text-foreground/80',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
