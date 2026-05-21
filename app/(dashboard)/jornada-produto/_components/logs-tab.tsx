'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LogPayloadSheet } from '@/app/(dashboard)/logs/_components/log-payload-sheet'
import { formatDateTime } from '@/lib/utils/format'
import type { LogEntry } from '@/types/entities'

interface Props {
  logs: LogEntry[]
}

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function LogsTab({ logs }: Props) {
  const t = useTranslations('jornadaProduto')
  const tLogs = useTranslations('logs')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const term = normalize(query.trim())
    if (!term) return logs
    return logs.filter((log) => {
      const payloadStr = log.payload != null ? JSON.stringify(log.payload) : ''
      const haystack = normalize(
        [log.event_name, log.email, log.module, log.user, payloadStr].filter(Boolean).join(' '),
      )
      return haystack.includes(term)
    })
  }, [logs, query])

  if (logs.length === 0) {
    return <p className="text-muted-foreground py-2 text-sm">{t('logs.noLogs')}</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('logs.searchPlaceholder')}
            className="pr-8 pl-8"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
              onClick={() => setQuery('')}
              aria-label={t('logs.clearSearch')}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
          {query
            ? t('logs.filteredCount', {
                shown: filtered.length,
                total: logs.length,
              })
            : t('logs.count', { count: logs.length })}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-2 text-sm">{t('logs.noMatches', { q: query })}</p>
      ) : (
        <div className="border-border overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[170px]">{tLogs('columns.timestamp')}</TableHead>
                <TableHead>{tLogs('columns.event')}</TableHead>
                <TableHead className="hidden sm:table-cell">{tLogs('columns.module')}</TableHead>
                <TableHead className="hidden md:table-cell">{tLogs('columns.user')}</TableHead>
                <TableHead className="text-right">{tLogs('columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">
                    {formatDateTime(log.created_at)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.event_name ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {log.module ? (
                      <Badge variant="outline">{log.module}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-xs md:table-cell">
                    {log.email ?? <span className="font-mono">{log.user ?? '—'}</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <LogPayloadSheet log={log} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
