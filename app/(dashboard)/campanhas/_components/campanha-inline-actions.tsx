'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import {
  Copy,
  Download,
  Layers,
  ListOrdered,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Trash2,
  Loader2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CampanhaDialog } from './campanha-dialog'
import { deleteCampanhaAction } from '../_actions'
import type { Campanha } from '@/types/entities'

interface Props {
  campanha: Campanha
  canWrite?: boolean
}

export function CampanhaInlineActions({ campanha, canWrite = false }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('campanhas')
  const tc = useTranslations('common')

  const code = campanha.cod_campanha

  function handleCopy() {
    navigator.clipboard.writeText(code).then(
      () => toast.success(t('codeCopied')),
      () => toast.error(tc('errorGeneric')),
    )
  }

  function handlePending(label: string) {
    toast.message(label, { description: t('featurePending') })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCampanhaAction(code)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Campanha excluída')
      setDeleteOpen(false)
    })
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Button
        variant="ghost"
        size="icon"
        title={t('copyCode')}
        aria-label={t('copyCode')}
        onClick={handleCopy}
      >
        <Copy className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        title={t('viewAgrupamentos')}
        aria-label={t('viewAgrupamentos')}
        asChild
      >
        <Link href={`/agrupamentos/${code}` as `/${string}`}>
          <Layers className="size-4" />
        </Link>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        title={t('viewProducts')}
        aria-label={t('viewProducts')}
        asChild
      >
        <Link href={`/produtos/${code}` as `/${string}`}>
          <ListOrdered className="size-4" />
        </Link>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        title={t('downloadReport')}
        aria-label={t('downloadReport')}
        onClick={() => handlePending(t('downloadReport'))}
      >
        <Download className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        title={t('syncCampaign')}
        aria-label={t('syncCampaign')}
        onClick={() => handlePending(t('syncCampaign'))}
      >
        <RefreshCw className="size-4" />
      </Button>

      {canWrite && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={tc('actions')}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              {t('editButton')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              {t('deleteButton')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <CampanhaDialog
        campanha={campanha}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tc('confirmDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tc('confirmDeleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              {tc('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                tc('delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
