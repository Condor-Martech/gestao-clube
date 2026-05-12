'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Smartphone, ChevronLeft, ChevronRight } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { SidebarNav } from './sidebar-nav'
import type { NavSection } from '@/lib/navigation'

interface SidebarClientProps {
  title: string
  sections: NavSection[]
}

export function SidebarClient({ title, sections }: SidebarClientProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'relative hidden md:flex flex-col shrink-0',
        'border-r border-border',
        'bg-zinc-100 dark:bg-zinc-900',
        'transition-[width] duration-300 ease-in-out overflow-visible',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <Link
        href="/dashboard"
        className={cn(
          'flex h-14 shrink-0 items-center gap-2 border-b border-border',
          collapsed ? 'justify-center px-0' : 'px-6'
        )}
      >
        <Smartphone className="size-5 shrink-0" />
        {!collapsed && (
          <span className="text-sm font-semibold tracking-tight truncate">{title}</span>
        )}
      </Link>

      {/* Nav */}
      <ScrollArea className="flex-1">
        <div className={cn('py-4', collapsed ? 'px-2' : 'px-3')}>
          <SidebarNav sections={sections} collapsed={collapsed} />
        </div>
      </ScrollArea>

      {/* Version */}
      <div
        className={cn(
          'shrink-0 border-t border-border px-3 py-2 flex items-center',
          collapsed ? 'justify-center' : 'justify-start'
        )}
      >
        {collapsed ? (
          <span className="size-1.5 rounded-full bg-muted-foreground/30" />
        ) : (
          <span className="text-[10px] font-mono text-muted-foreground/50 select-none">
            v{process.env.NEXT_PUBLIC_APP_VERSION}
          </span>
        )}
      </div>

      {/* Toggle — floats on the right border, just below the header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-[44px] z-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  )
}
