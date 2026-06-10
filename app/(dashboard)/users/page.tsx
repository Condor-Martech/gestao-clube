import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/guards'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { InviteUserDialog } from './_components/invite-user-dialog'
import { EditUserDialog } from './_components/edit-user-dialog'
import { UsersSearch } from './_components/users-search'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { formatDateTime } from '@/lib/utils/format'
import { DEFAULT_PAGE_SIZE, parsePage, rangeFromPage, totalPages } from '@/lib/utils/pagination'
import { pickString } from '@/lib/utils/search-params'
import type { UserSystem, UserRole } from '@/types/entities'

interface Props {
  searchParams: Promise<{
    search?: string | string[]
    page?: string | string[]
  }>
}

const ROLE_VARIANT: Record<UserRole, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  manager: 'secondary',
  user: 'outline',
}

export default async function UsersPage({ searchParams }: Props) {
  await requireAdmin()

  const sp = await searchParams
  const t = await getTranslations('users')
  const tRoles = await getTranslations('users.roles')
  const tc = await getTranslations('common')

  const search = pickString(sp.search)
  const page = parsePage(pickString(sp.page))
  const range = rangeFromPage({ page, pageSize: DEFAULT_PAGE_SIZE })

  const supabase = await createClient()
  let query = supabase
    .from('users_system')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(range.from, range.to)

  if (search) query = query.ilike('email', `%${search}%`)

  const { data, count, error } = await query
  const users = (data ?? []) as unknown as UserSystem[]
  const total = count ?? 0
  const pages = totalPages(total, DEFAULT_PAGE_SIZE)

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        </div>
        <InviteUserDialog />
      </header>

      <UsersSearch />

      <div className="border-border rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('columns.email')}</TableHead>
              <TableHead className="w-[140px]">{t('columns.role')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('columns.phone')}</TableHead>
              <TableHead className="w-[100px]">{t('columns.status')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('columns.lastLogin')}</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-destructive py-8 text-center">
                  {error.message}
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                  {tc('noResults')}
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const role = (u.role ?? 'user') as UserRole
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={ROLE_VARIANT[role] ?? 'outline'}>
                        {tRoles.has(role as Parameters<typeof tRoles>[0])
                          ? tRoles(role as Parameters<typeof tRoles>[0])
                          : role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">
                      {u.phone ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.status ? 'success' : 'secondary'}>
                        {u.status ? t('statusActive') : t('statusInactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-xs lg:table-cell">
                      {u.last_login ? formatDateTime(u.last_login) : '—'}
                    </TableCell>
                    <TableCell>
                      <EditUserDialog user={u} />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {total > DEFAULT_PAGE_SIZE && <PaginationControls page={page} totalPages={pages} />}
    </div>
  )
}
