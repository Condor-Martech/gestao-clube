'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, Megaphone } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SidebarNav } from './sidebar-nav'
import type { NavSection } from '@/lib/navigation'

interface MobileNavProps {
  sections: NavSection[]
}

export function MobileNav({ sections }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const t = useTranslations()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="size-5" />
          <span className="sr-only">{t('nav.openMenu')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <Link
          href="/dashboard"
          onClick={() => setOpen(false)}
          className="border-border flex h-14 items-center gap-2 border-b px-6"
        >
          <Megaphone className="size-5 shrink-0" />
          <span className="text-sm font-semibold tracking-tight">{t('app.title')}</span>
        </Link>
        <ScrollArea className="h-[calc(100svh-3.5rem)]">
          <div className="p-4">
            <SidebarNav sections={sections} onNavigate={() => setOpen(false)} />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
