'use client'

import {
  LayoutDashboard,
  Megaphone,
  Package,
  Route,
  Workflow,
  BarChart3,
  Store,
  Clock,
  Users,
  ScrollText,
  BookOpen,
  FileCog,
  LayoutGrid,
  Gift,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NavIconKey } from '@/lib/navigation'

const ICON_MAP: Record<NavIconKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  campanhas: Megaphone,
  produtos: Package,
  jornadaProduto: Route,
  regrasOrdenacao: Workflow,
  stores: BarChart3,
  lojas: Store,
  history: Clock,
  users: Users,
  logs: ScrollText,
  help: BookOpen,
  helpSystem: FileCog,
  bannerSuperApp: LayoutGrid,
  numeroDaSorte: Gift,
}

interface Props extends React.SVGProps<SVGSVGElement> {
  name: NavIconKey
}

export function NavIcon({ name, className, ...props }: Props) {
  const Icon = ICON_MAP[name]
  return <Icon className={cn('size-4 shrink-0', className)} {...props} />
}
