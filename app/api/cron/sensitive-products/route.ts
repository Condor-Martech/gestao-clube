import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAlertasConfig } from '@/lib/alertas/config'
import {
  getSensitiveProdutosInCampanhas,
  type SensitiveProduto,
} from '@/lib/sensitive-products'
import { sendEvolutionText } from '@/lib/whatsapp/evolution'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TZ = 'America/Sao_Paulo'

/** Hora atual (0–23) no fuso de Brasília. */
function currentHour(now: Date): number {
  return Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ,
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(now),
  )
}

/**
 * Horas decorridas desde o resumo anterior — derivado da própria lista de
 * horários, sem precisar de tabela de estado. Com [8, 18]: às 18h devolve 10,
 * às 8h devolve 14. Com um único horário, devolve 24.
 */
function windowHours(horas: number[], hour: number): number {
  const sorted = [...new Set(horas)].sort((a, b) => a - b)
  const earlier = sorted.filter((h) => h < hour)
  const prev = earlier.length
    ? earlier[earlier.length - 1]
    : sorted[sorted.length - 1]
  const delta = (hour - prev + 24) % 24
  return delta === 0 ? 24 : delta
}

function buildDigest(
  produtos: SensitiveProduto[],
  dateLabel: string,
  janela: number,
): string {
  const lines = produtos.map(
    (p) =>
      `• *${p.nome ?? p.ean ?? 'Produto'}*${
        p.campanha ? ` — campanha ${p.campanha}` : ''
      }`,
  )
  return [
    '🚨 *Produtos Sensíveis em Campanhas*',
    dateLabel,
    '',
    `${produtos.length} produto(s) sensível(is) entraram em campanhas nas últimas ${janela}h:`,
    '',
    ...lines,
    '',
    '— Ativação Condor',
  ].join('\n')
}

/**
 * Cron de alerta de produtos sensíveis. Pensado para rodar DE HORA EM HORA
 * (ex.: Vercel Cron `0 * * * *`). A cada execução lê `alertas_config`:
 *  - se inativo, ou se a hora atual não está em `horas_resumo`, sai em silêncio;
 *  - senão, monta o resumo da janela desde o resumo anterior e envia para
 *    todos os grupos de WhatsApp configurados.
 *
 * Protegido por `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function GET(request: Request) {
  if (!env.CRON_SECRET) {
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET não configurado' },
      { status: 500 },
    )
  }
  if (request.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json(
      { ok: false, error: 'Não autorizado' },
      { status: 401 },
    )
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY não configurado' },
      { status: 500 },
    )
  }

  const supabase = createAdminClient()
  const config = await getAlertasConfig(supabase)

  if (!config.ativo) {
    return NextResponse.json({ ok: true, skipped: 'inativo' })
  }

  const now = new Date()
  const hour = currentHour(now)
  if (!config.horasResumo.includes(hour)) {
    return NextResponse.json({ ok: true, skipped: 'fora-de-horario', hour })
  }
  if (config.grupos.length === 0) {
    return NextResponse.json({ ok: true, skipped: 'sem-grupos' })
  }

  const janela = windowHours(config.horasResumo, hour)
  const since = new Date(now.getTime() - janela * 3_600_000).toISOString()

  let produtos: SensitiveProduto[]
  try {
    produtos = await getSensitiveProdutosInCampanhas(supabase, {
      keywords: config.keywords,
      since,
      limit: 100,
    })
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Erro de consulta',
      },
      { status: 500 },
    )
  }

  // Nada novo na janela — fica em silêncio, só registra a execução.
  if (produtos.length === 0) {
    await supabase.from('logs').insert({
      event_name: 'alerta_produtos_sensiveis',
      module: 'alertas',
      payload: { count: 0, sent: false, janela },
    })
    return NextResponse.json({ ok: true, count: 0, sent: false })
  }

  const dateLabel = now.toLocaleDateString('pt-BR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const text = buildDigest(produtos, dateLabel, janela)

  const results = await Promise.all(
    config.grupos.map(async (g) => {
      const r = await sendEvolutionText({ to: g.jid, text })
      return { grupo: g.label || g.jid, ok: r.ok, error: r.ok ? null : r.error }
    }),
  )
  const enviados = results.filter((r) => r.ok).length
  const falhas = results.filter((r) => !r.ok)

  await supabase.from('logs').insert({
    event_name: 'alerta_produtos_sensiveis',
    module: 'alertas',
    payload: {
      count: produtos.length,
      grupos: config.grupos.length,
      enviados,
      janela,
      falhas: falhas.map((f) => ({ grupo: f.grupo, error: f.error })),
    },
  })

  return NextResponse.json(
    { ok: enviados > 0, count: produtos.length, enviados, falhas: falhas.length },
    { status: enviados > 0 ? 200 : 502 },
  )
}
