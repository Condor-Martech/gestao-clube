'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Copy,
  Download,
  Layers,
  ListOrdered,
  Loader2,
  MoreVertical,
  RefreshCw,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
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
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Campanha } from '@/types/entities'
import { syncCampanhaAction } from '../_actions'

interface Props {
  campanha: Campanha
}

export function CampanhaInlineActions({ campanha }: Props) {
  const t = useTranslations('campanhas')
  const tc = useTranslations('common')

  const code = campanha.cod_campanha

  const [syncOpen, setSyncOpen] = useState(false)
  const [isSyncing, startSyncTransition] = useTransition()

  function handleCopy() {
    navigator.clipboard.writeText(code).then(
      () => toast.success(t('codeCopied')),
      () => toast.error(tc('errorGeneric')),
    )
  }

  function handleDownload() {
    toast.message(t('downloadStarting'))
    window.location.assign(`/api/campanhas/${encodeURIComponent(code)}/export`)
  }

  function handleSyncConfirm() {
    startSyncTransition(async () => {
      const result = await syncCampanhaAction(campanha.cod_campanha)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(t('syncSuccess'))
      setSyncOpen(false)
    })
  }

  return (
    <div className="flex items-center justify-end">
      <AlertDialog open={syncOpen} onOpenChange={setSyncOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={isSyncing}
            title={t('syncCampaign')}
            aria-label={t('syncCampaign')}
          >
            {isSyncing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('syncConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('syncConfirmDescription', { code: campanha.cod_campanha })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSyncing}>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleSyncConfirm} disabled={isSyncing}>
              {isSyncing && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t('syncConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            title={t('openActions')}
            aria-label={t('openActions')}
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={handleCopy}>
            <Copy />
            {t('copyCode')}
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href={`/agrupamentos/${code}` as `/${string}`}>
              <Layers />
              {t('viewAgrupamentos')}
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href={`/produtos/${code}` as `/${string}`}>
              <ListOrdered />
              {t('viewProducts')}
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={handleDownload}>
            <Download />
            {t('downloadReport')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
