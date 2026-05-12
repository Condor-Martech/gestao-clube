'use client'

import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface Props {
  ean: string
}

export function CopyEanButton({ ean }: Props) {
  const t = useTranslations('produtos')

  function handleCopy() {
    navigator.clipboard.writeText(ean).then(
      () => toast.success(t('eanCopied')),
      () => toast.error('Erro'),
    )
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={t('copyEan')}
      aria-label={t('copyEan')}
      className="text-muted-foreground hover:text-foreground inline-flex size-6 items-center justify-center rounded transition-colors"
    >
      <Copy className="size-3.5" />
    </button>
  )
}
