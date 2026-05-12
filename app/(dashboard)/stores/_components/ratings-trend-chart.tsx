'use client'

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
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

export interface TrendPoint {
  date: string
  play: number | null
  app_store: number | null
}

interface Props {
  data: TrendPoint[]
}

export function RatingsTrendChart({ data }: Props) {
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
      <AreaChart data={formatted} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="playGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="asGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" className="text-xs" tickLine={false} axisLine={false} />
        <YAxis
          domain={[0, 5]}
          tickCount={6}
          className="text-xs"
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(v) => (v == null ? '—' : (v as number).toFixed(2))}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="play"
          name={t('legendPlay')}
          stroke="#22c55e"
          fill="url(#playGrad)"
          strokeWidth={2}
          connectNulls
        />
        <Area
          type="monotone"
          dataKey="app_store"
          name={t('legendAppStore')}
          stroke="#3b82f6"
          fill="url(#asGrad)"
          strokeWidth={2}
          connectNulls
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
