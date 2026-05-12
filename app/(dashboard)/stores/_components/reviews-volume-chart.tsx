'use client'

import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTranslations } from 'next-intl'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface VolumePoint {
  date: string
  play: number
  app_store: number
}

interface Props {
  data: VolumePoint[]
}

export function ReviewsVolumeChart({ data }: Props) {
  const t = useTranslations('stores.charts')

  const formatted = useMemo(
    () =>
      data.map((p) => ({
        ...p,
        label: format(parseISO(p.date), 'dd/MM', { locale: ptBR }),
      })),
    [data],
  )

  if (formatted.length === 0) {
    return (
      <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
        {t('empty')}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={formatted} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" className="text-xs" tickLine={false} axisLine={false} />
        <YAxis className="text-xs" tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="play" name={t('legendPlay')} fill="#22c55e" radius={[3, 3, 0, 0]} />
        <Bar dataKey="app_store" name={t('legendAppStore')} fill="#3b82f6" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
