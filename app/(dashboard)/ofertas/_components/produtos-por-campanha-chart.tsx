'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTranslations } from 'next-intl'

export interface ProdutoCampanhaPoint {
  campanha: string
  total: number
}

interface Props {
  data: ProdutoCampanhaPoint[]
}

/** Barras horizontais: quantidade de produtos por campanha (top N). */
export function ProdutosPorCampanhaChart({ data }: Props) {
  const t = useTranslations('ofertasDashboard.charts')

  if (data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-[280px] items-center justify-center text-sm">
        {t('empty')}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 16, left: 8, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          className="stroke-border"
          horizontal={false}
        />
        <XAxis
          type="number"
          className="text-xs"
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="campanha"
          className="text-xs"
          tickLine={false}
          axisLine={false}
          width={140}
          tickFormatter={(v: string) =>
            v.length > 20 ? `${v.slice(0, 19)}…` : v
          }
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar
          dataKey="total"
          name={t('produtosLegend')}
          fill="#3b82f6"
          radius={[0, 3, 3, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
