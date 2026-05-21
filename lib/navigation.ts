import { HELP_DOCS } from './help-docs'
import { type Module, type ModuleRoles, hasModuleAccess } from '@/lib/rbac'

export type Role = 'admin' | 'manager' | 'user'

export type NavIconKey =
  | 'dashboard'
  | 'campanhas'
  | 'produtos'
  | 'jornadaProduto'
  | 'regrasOrdenacao'
  | 'stores'
  | 'lojas'
  | 'history'
  | 'users'
  | 'logs'
  | 'help'
  | 'helpSystem'
  | 'bannerSuperApp'
  | 'numeroDaSorte'
  | 'configuracoes'

export interface NavItem {
  href: string
  labelKey: string
  iconKey: NavIconKey
  roles: readonly Role[]
  /** Module that gates visibility. Undefined = always visible to authenticated users. */
  module?: Module
}

export interface NavSection {
  titleKey: string
  items: readonly NavItem[]
}

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    titleKey: 'overview',
    items: [
      {
        href: '/dashboard',
        labelKey: 'dashboard',
        iconKey: 'dashboard',
        roles: ['admin', 'manager', 'user'],
      },
    ],
  },
  {
    titleKey: 'commercial',
    items: [
      {
        href: '/campanhas',
        labelKey: 'campanhas',
        iconKey: 'campanhas',
        roles: ['admin', 'manager', 'user'],
        module: 'ofertas',
      },
      {
        href: '/produtos',
        labelKey: 'produtos',
        iconKey: 'produtos',
        roles: ['admin', 'manager', 'user'],
        module: 'ofertas',
      },
      {
        href: '/jornada-produto',
        labelKey: 'jornadaProduto',
        iconKey: 'jornadaProduto',
        roles: ['admin', 'manager', 'user'],
        module: 'ofertas',
      },
      {
        href: '/produtos/ordenar',
        labelKey: 'regrasOrdenacao',
        iconKey: 'regrasOrdenacao',
        roles: ['admin', 'manager', 'user'],
        module: 'ofertas',
      },
    ],
  },
  {
    titleKey: 'content',
    items: [
      {
        href: '/banner-super-app',
        labelKey: 'bannerSuperApp',
        iconKey: 'bannerSuperApp',
        roles: ['admin', 'manager', 'user'],
        module: 'conteudo',
      },
      {
        href: '/numero-da-sorte',
        labelKey: 'numeroDaSorte',
        iconKey: 'numeroDaSorte',
        roles: ['admin', 'manager', 'user'],
        module: 'conteudo',
      },
    ],
  },
  {
    titleKey: 'intelligence',
    items: [],
  },
  {
    titleKey: 'stores',
    items: [
      {
        href: '/stores',
        labelKey: 'storesOverview',
        iconKey: 'stores',
        roles: ['admin', 'manager', 'user'],
        module: 'stores',
      },
    ],
  },
  {
    titleKey: 'operations',
    items: [
      {
        href: '/lojas',
        labelKey: 'lojas',
        iconKey: 'lojas',
        roles: ['admin', 'manager', 'user'],
        module: 'stores',
      },
    ],
  },
  {
    titleKey: 'system',
    items: [
{
        href: '/users',
        labelKey: 'users',
        iconKey: 'users',
        roles: ['admin'],
        module: 'sistemas',
      },
      {
        href: '/configuracoes',
        labelKey: 'configuracoes',
        iconKey: 'configuracoes',
        roles: ['admin'],
        module: 'sistemas',
      },
      {
        href: '/logs',
        labelKey: 'logs',
        iconKey: 'logs',
        roles: ['admin', 'manager', 'user'],
        module: 'operacionais',
      },
    ],
  },
  {
    titleKey: 'help',
    items: HELP_DOCS.map((doc) => ({
      href: `/ajuda/${doc.slug}`,
      labelKey: doc.labelKey,
      iconKey: doc.iconKey,
      roles: doc.roles,
    })),
  },
]

export function filterNavSections(isAdmin: boolean, moduleRoles: ModuleRoles): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (!item.module) return true
      return hasModuleAccess(isAdmin, item.module, moduleRoles)
    }),
  })).filter((section) => section.items.length > 0)
}
