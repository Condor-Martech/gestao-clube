'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  Archive,
  Eye,
  FileText,
  Globe,
  Loader2,
  Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils/format'
import { NDSFormDialog } from './nds-form-dialog'
import { NDSViewDialog } from './nds-view-dialog'
import {
  publishNumeroDaSorteAction,
  unpublishNumeroDaSorteAction,
} from '../_actions'
import type { EntrySchedule, NumeroDaSorte } from '@/types/entities'

interface Props {
  items: NumeroDaSorte[]
  schedules: Record<number, EntrySchedule>
  canWrite?: boolean
}

type Status = 'rascunho' | 'agendado' | 'ativo' | 'encerrado'

function computeStatus(nds: NumeroDaSorte): Status {
  if (!nds.publishedAt) return 'rascunho'
  const today = new Date().toISOString().slice(0, 10)
  if (today < nds.startDate) return 'agendado'
  if (today > nds.endDate) return 'encerrado'
  return 'ativo'
}

const STATUS_VARIANT: Record<
  Status,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  rascunho: 'secondary',
  agendado: 'outline',
  ativo: 'default',
  encerrado: 'outline',
}

export function NDSTable({ items, schedules, canWrite = false }: Props) {
  const [filter, setFilter] = useState('')
  const t = useTranslations('numero_da_sorte')
  const tCommon = useTranslations('common')

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (i) =>
        i.titulo.toLowerCase().includes(q) ||
        String(i.numeroCampanha).includes(q),
    )
  }, [items, filter])

  return (
    <div className="space-y-3">
      <Input
        type="search"
        placeholder={t('searchPlaceholder')}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-sm"
      />

      <div className="border-border overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">{t('columns.banner')}</TableHead>
              <TableHead>{t('columns.titulo')}</TableHead>
              <TableHead className="w-[120px]">{t('columns.numero')}</TableHead>
              <TableHead className="hidden w-[220px] md:table-cell">
                {t('columns.vigencia')}
              </TableHead>
              <TableHead className="w-[100px]">{t('columns.status')}</TableHead>
              <TableHead className="hidden w-[100px] lg:table-cell">
                {t('columns.regulamento')}
              </TableHead>
              <TableHead className="w-[140px] text-right">
                {tCommon('actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground p-12 text-center"
                >
                  {filter ? tCommon('noResults') : t('empty')}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((nds) => (
                <NDSRow key={nds.id} nds={nds} schedule={schedules[nds.id]} canWrite={canWrite} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function NDSRow({
  nds,
  schedule,
  canWrite = false,
}: {
  nds: NumeroDaSorte
  schedule: EntrySchedule | undefined
  canWrite?: boolean
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('numero_da_sorte')
  const tCommon = useTranslations('common')

  const status = computeStatus(nds)
  const isPublished = nds.publishedAt !== null

  function handleTogglePublish() {
    startTransition(async () => {
      const r = isPublished
        ? await unpublishNumeroDaSorteAction(nds.id)
        : await publishNumeroDaSorteAction(nds.id)
      if (!r.ok) {
        toast.error(r.error)
        return
      }
      toast.success(isPublished ? t('unpublished') : t('published'))
    })
  }

  return (
    <>
      <TableRow>
        <TableCell>
          <button
            type="button"
            onClick={() => setViewOpen(true)}
            className="bg-muted relative aspect-video w-16 overflow-hidden rounded"
            aria-label={tCommon('viewDetails')}
          >
            {nds.banner.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={nds.banner.url}
                alt={nds.titulo}
                className="h-full w-full object-cover"
              />
            ) : null}
          </button>
        </TableCell>
        <TableCell className="font-medium">{nds.titulo}</TableCell>
        <TableCell className="font-mono text-xs">
          #{nds.numeroCampanha}
        </TableCell>
        <TableCell className="text-muted-foreground hidden text-xs md:table-cell">
          {formatDate(nds.startDate)} → {formatDate(nds.endDate)}
        </TableCell>
        <TableCell>
          <Badge variant={STATUS_VARIANT[status]}>
            {t(`status.${status}`)}
          </Badge>
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          {nds.regulamento.url ? (
            <a
              href={nds.regulamento.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
            >
              <FileText className="size-3" />
              PDF
            </a>
          ) : null}
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewOpen(true)}
              title={tCommon('viewDetails')}
            >
              <Eye className="size-4" />
            </Button>
            {canWrite && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleTogglePublish}
                  disabled={isPending}
                  title={isPublished ? t('unpublish') : t('publish')}
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : isPublished ? (
                    <Archive className="size-4" />
                  ) : (
                    <Globe className="size-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditOpen(true)}
                  title={tCommon('edit')}
                >
                  <Pencil className="size-4" />
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>
      <NDSViewDialog
        nds={nds}
        schedule={schedule}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
      <NDSFormDialog
        nds={nds}
        schedule={schedule}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}
