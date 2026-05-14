'use client'

import Link from 'next/link'
import { Copy, Download, Layers, ListOrdered, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { Campanha } from '@/types/entities'

interface Props {
  campanha: Campanha
}

export function CampanhaInlineActions({ campanha }: Props) {
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
    </div>
  )
}
