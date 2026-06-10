import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireModuleRead } from '@/lib/auth/guards'

const MAX_ROWS = 10000

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s =
    typeof value === 'string'
      ? value
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

interface Row {
  ean: string | null
  nome: string | null
  descricao: string | null
  unidade: string | null
  departamento: string | null
  setor: string | null
  order: number | null
  aproved: boolean | null
  aproved_user: string | null
  aproved_at: string | null
  img_external: string | null
  created_at: string | null
  updated_at: string | null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ cod_campanha: string }> },
) {
  await requireModuleRead('ofertas')

  const { cod_campanha: codCampanha } = await params

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('produtos_pai')
    .select('*')
    .eq('campanha', codCampanha)
    .order('order', { ascending: true, nullsFirst: false })
    .limit(MAX_ROWS)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (data ?? []) as unknown as Row[]
  const headers = [
    'ean',
    'nome',
    'descricao',
    'unidade',
    'departamento',
    'setor',
    'order',
    'aproved',
    'aproved_user',
    'aproved_at',
    'img_external',
    'created_at',
    'updated_at',
  ]
  const lines = [headers.join(',')]
  for (const r of rows) {
    const aproved = r.aproved === null || r.aproved === undefined ? '' : r.aproved ? 'Sim' : 'Não'
    lines.push(
      [
        r.ean,
        r.nome,
        r.descricao,
        r.unidade,
        r.departamento,
        r.setor,
        r.order,
        aproved,
        r.aproved_user,
        r.aproved_at,
        r.img_external,
        r.created_at,
        r.updated_at,
      ]
        .map(csvEscape)
        .join(','),
    )
  }
  const csv = '﻿' + lines.join('\n')

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="campanha-${codCampanha}-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
