'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2, Loader2, Eye, EyeOff, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { NDSFormDialog } from './nds-form-dialog'
import {
  deleteNumeroDaSorteAction,
  publishNumeroDaSorteAction,
  unpublishNumeroDaSorteAction,
} from '../_actions'
import type { NumeroDaSorte } from '@/types/entities'

interface Props {
  nds: NumeroDaSorte
}

type Status = 'rascunho' | 'agendado' | 'ativo' | 'encerrado'

function computeStatus(nds: NumeroDaSorte): Status {
  if (!nds.publishedAt) return 'rascunho'
  const today = new Date().toISOString().slice(0, 10)
  if (today < nds.startDate) return 'agendado'
  if (today > nds.endDate) return 'encerrado'
  return 'ativo'
}

const STATUS_VARIANT: Record<Status, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  rascunho: 'secondary',
  agendado: 'outline',
  ativo: 'default',
  encerrado: 'outline',
}

export function NDSCard({ nds }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('numero_da_sorte')
  const tCommon = useTranslations('common')

  const status = computeStatus(nds)
  const isPublished = nds.publishedAt !== null

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteNumeroDaSorteAction(nds.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(t('deleted'))
    })
  }

  function handleTogglePublish() {
    startTransition(async () => {
      const result = isPublished
        ? await unpublishNumeroDaSorteAction(nds.id)
        : await publishNumeroDaSorteAction(nds.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(isPublished ? t('unpublished') : t('published'))
    })
  }

  return (
    <article className="border-border bg-card overflow-hidden rounded-lg border">
      <div className="bg-muted relative aspect-video w-full">
        {nds.banner.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={nds.banner.url} alt={nds.titulo} className="h-full w-full object-cover" />
        ) : null}
        <Badge variant={STATUS_VARIANT[status]} className="absolute top-2 right-2">
          {t(`status.${status}`)}
        </Badge>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h3 className="leading-tight font-semibold">{nds.titulo}</h3>
            <p className="text-muted-foreground font-mono text-xs">#{nds.numeroCampanha}</p>
            <p className="text-muted-foreground text-xs">
              {nds.startDate} → {nds.endDate}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleTogglePublish} disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isPublished ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={isPending}
                >
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{tCommon('confirmDeleteTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {tCommon('confirmDeleteDescription')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault()
                      handleDelete()
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {tCommon('delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {nds.regulamento.url ? (
          <a
            href={nds.regulamento.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
          >
            <FileText className="size-3" />
            {t('viewRegulamento')}
          </a>
        ) : null}
      </div>

      <NDSFormDialog nds={nds} open={editOpen} onOpenChange={setEditOpen} />
    </article>
  )
}
