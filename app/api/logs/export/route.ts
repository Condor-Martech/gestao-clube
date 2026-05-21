import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const LOGS_VIEW = 'logs_with_users'
const MAX_ROWS = 10000

function escapeIlike(value: string) {
  return value.replace(/[%_]/g, (m) => `\\${m}`)
}

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
  id: string
  created_at: string
  event_name: string | null
  user: string | null
  email: string | null
  module: string | null
  payload: unknown
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const q = sp.get('q')?.trim() || undefined
  const from = sp.get('from')?.trim() || undefined
  const to = sp.get('to')?.trim() || undefined
  const moduleParam = sp.get('module')?.trim() || undefined

  const supabase = await createClient()

  let query = supabase
    .from(LOGS_VIEW)
    .select('id, created_at, event_name, user, email, module, payload')
    .order('created_at', { ascending: false })
    .limit(MAX_ROWS)

  if (from) query = query.gte('created_at', `${from}T00:00:00.000Z`)
  if (to) query = query.lte('created_at', `${to}T23:59:59.999Z`)
  if (moduleParam) query = query.eq('module', moduleParam)
  if (q) {
    const safe = escapeIlike(q)
    query = query.or(`event_name.ilike.%${safe}%,email.ilike.%${safe}%,module.ilike.%${safe}%`)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (data ?? []) as Row[]
  const headers = ['id', 'created_at', 'module', 'event_name', 'user_id', 'email', 'payload']
  const lines = [headers.join(',')]
  for (const r of rows) {
    lines.push(
      [r.id, r.created_at, r.module, r.event_name, r.user, r.email, r.payload]
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
      'Content-Disposition': `attachment; filename="logs-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
