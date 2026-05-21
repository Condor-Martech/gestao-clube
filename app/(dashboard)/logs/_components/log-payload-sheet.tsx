'use client'

import { useState } from 'react'
import { Copy, Eye, FileImage, FileJson } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { JsonHighlight } from '@/components/shared/json-highlight'
import { formatDateTime } from '@/lib/utils/format'
import type { LogEntry } from '@/types/entities'

interface Props {
  log: LogEntry
}

function isEmptyPayload(payload: unknown) {
  return (
    payload === null ||
    payload === undefined ||
    (typeof payload === 'object' && Object.keys(payload as object).length === 0)
  )
}

export function LogPayloadSheet({ log }: Props) {
  const [open, setOpen] = useState(false)
  const t = useTranslations('logs')

  if (isEmptyPayload(log.payload)) {
    return <span className="text-muted-foreground text-xs">{t('payloadEmpty')}</span>
  }

  async function copyJson() {
    await navigator.clipboard.writeText(JSON.stringify(log.payload, null, 2))
    toast.success(t('copied'))
  }

  const evidenceHref = `/api/logs/${log.id}/evidence`

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="size-4" />
          {t('viewPayload')}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <div className="flex h-full flex-col">
          <div className="space-y-3 pt-2 pb-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <FileJson className="size-5" />
                {t('payloadTitle')}
              </h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={copyJson}>
                  <Copy className="size-4" />
                  {t('copy')}
                </Button>
                <Button asChild variant="default" size="sm">
                  <a
                    href={evidenceHref}
                    download
                    onClick={() => toast.success(t('evidenceDownloaded'))}
                  >
                    <FileImage className="size-4" />
                    {t('downloadEvidence')}
                  </a>
                </Button>
              </div>
            </div>
            <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span>
                <span className="font-medium">{t('columns.timestamp')}:</span>{' '}
                <span className="font-mono">{formatDateTime(log.created_at)}</span>
              </span>
              {log.module && (
                <span>
                  <span className="font-medium">{t('columns.module')}:</span>{' '}
                  <Badge variant="outline">{log.module}</Badge>
                </span>
              )}
              {log.email && (
                <span>
                  <span className="font-medium">{t('columns.user')}:</span>{' '}
                  <span className="font-mono">{log.email}</span>
                </span>
              )}
              {log.event_name && (
                <span>
                  <span className="font-medium">{t('columns.event')}:</span>{' '}
                  <code className="bg-muted rounded px-1.5 py-0.5">{log.event_name}</code>
                </span>
              )}
            </div>
          </div>
          <Separator />
          <div className="flex-1 overflow-hidden pt-4">
            <JsonHighlight data={log.payload} className="max-h-[calc(100vh-220px)]" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
