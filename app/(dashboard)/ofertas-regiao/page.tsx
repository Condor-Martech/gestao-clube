import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PermissionGate } from '@/components/rbac/permission-gate'
import { requireModuleRead } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/utils/format'
import type { Oferta } from '@/types/entities'
import { OfertaDeleteButton } from './_components/oferta-delete-button'
import { OfertaEditSheet } from './_components/oferta-edit-sheet'

export default async function OfertasRegiaoPage() {
  const { isAdmin, moduleRoles } = await requireModuleRead('operacionais')
  const t = await getTranslations('ofertasRegiao')
  const tCommon = await getTranslations('common')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('Ofertas')
    .select('*')
    .order('regiao', { ascending: true })

  const ofertas = (data ?? []) as unknown as Oferta[]

  return (
    <div className="space-y-4">
      <header className="border-border bg-card flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        </div>
      </header>

      <div className="border-border overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[110px]">{t('columns.regiao')}</TableHead>
              <TableHead>{t('columns.title')}</TableHead>
              <TableHead className="w-[110px]">{t('columns.video')}</TableHead>
              <TableHead className="w-[200px]">{t('columns.carrosseis')}</TableHead>
              <TableHead className="w-[160px]">{t('columns.updated')}</TableHead>
              <TableHead className="w-[110px] text-right">{t('columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-destructive py-8 text-center">
                  {error.message}
                </TableCell>
              </TableRow>
            ) : ofertas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                  {tCommon('noResults')}
                </TableCell>
              </TableRow>
            ) : (
              ofertas.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    {o.regiao && <Badge variant="outline">{o.regiao}</Badge>}
                  </TableCell>
                  <TableCell className="font-medium">{o.title ?? '—'}</TableCell>
                  <TableCell>
                    {o.video ? (
                      <a
                        href={o.video}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-xs underline-offset-2 hover:underline"
                      >
                        YouTube
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <CarrosselSummary oferta={o} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {o.created_at ? formatDateTime(o.created_at) : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <PermissionGate
                      isAdmin={isAdmin}
                      moduleRoles={moduleRoles}
                      module="operacionais"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <OfertaEditSheet oferta={o} />
                        <OfertaDeleteButton oferta={o} />
                      </div>
                    </PermissionGate>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function CarrosselSummary({ oferta }: { oferta: Oferta }) {
  const carrosseis = [oferta.carrosel, oferta.carrosel2, oferta.carrosel3]
  const previewUrl =
    oferta.carrosel?.images?.[0] ??
    oferta.carrosel2?.images?.[0] ??
    oferta.carrosel3?.images?.[0] ??
    null

  return (
    <div className="flex items-center gap-2">
      {previewUrl ? (
        <div className="bg-muted relative size-10 shrink-0 overflow-hidden rounded">
          <Image src={previewUrl} alt="" fill sizes="40px" className="object-cover" unoptimized />
        </div>
      ) : null}
      <div className="flex flex-wrap gap-1">
        {carrosseis.map((c, i) =>
          c ? (
            <span
              key={i}
              className="border-border inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px]"
            >
              <span
                className="size-2 rounded-sm"
                style={{ backgroundColor: c.cor }}
                aria-hidden
              />
              {c.images?.length ?? 0}
            </span>
          ) : null,
        )}
      </div>
    </div>
  )
}
