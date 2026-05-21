export const MODULES = [
  'ofertas',
  'conteudo',
  'stores',
  'operacionais',
  'sistemas',
] as const

export type Module = (typeof MODULES)[number]

export type ModuleLevel = 'user' | 'manager'

export type ModuleRoles = Partial<Record<Module, ModuleLevel>>

/** Modules that can be assigned to non-admin users. 'sistemas' is admin-only. */
export const ASSIGNABLE_MODULES = MODULES.filter((m) => m !== 'sistemas') as Exclude<
  Module,
  'sistemas'
>[]

/** Route prefix → module lookup. Ordered longest-first to avoid prefix conflicts. */
export const ROUTE_MODULE_MAP = [
  { prefix: '/jornada-produto', module: 'ofertas' as const },
  { prefix: '/banner-super-app', module: 'conteudo' as const },
  { prefix: '/numero-da-sorte', module: 'conteudo' as const },
  { prefix: '/campanhas', module: 'ofertas' as const },
  { prefix: '/ofertas', module: 'ofertas' as const },
  { prefix: '/agrupamentos', module: 'ofertas' as const },
  { prefix: '/produtos', module: 'ofertas' as const },
  { prefix: '/lojas', module: 'stores' as const },
  { prefix: '/stores', module: 'stores' as const },
  { prefix: '/history', module: 'operacionais' as const },
  { prefix: '/logs', module: 'operacionais' as const },
  { prefix: '/users', module: 'sistemas' as const },
]

export const ALWAYS_VISIBLE_PREFIXES = ['/dashboard', '/ajuda']

/** Returns the module for a given pathname, or null if the route is always visible or unknown. */
export function getModuleForPath(pathname: string): Module | null {
  if (ALWAYS_VISIBLE_PREFIXES.some((p) => pathname.startsWith(p))) return null
  return ROUTE_MODULE_MAP.find(({ prefix }) => pathname.startsWith(prefix))?.module ?? null
}
