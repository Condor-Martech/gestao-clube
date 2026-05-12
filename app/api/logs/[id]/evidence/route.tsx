import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PAYLOAD_MAX_CHARS = 3800
const VIEW = 'logs_with_users'

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function formatHash(hex: string) {
  return hex.match(/.{1,16}/g)?.join(' ') ?? hex
}

interface LogRow {
  id: string
  created_at: string
  event_name: string | null
  user: string | null
  email: string | null
  module: string | null
  payload: unknown
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from(VIEW)
    .select('id, created_at, event_name, user, email, module, payload')
    .eq('id', id)
    .single()

  if (error || !data) {
    return new Response('Log not found', { status: 404 })
  }

  const log = data as LogRow
  const canonicalJson = JSON.stringify(log.payload ?? null)
  const prettyJson = JSON.stringify(log.payload ?? null, null, 2)
  const hash = await sha256Hex(canonicalJson)
  const capturedAt = new Date().toISOString()

  const truncated = prettyJson.length > PAYLOAD_MAX_CHARS
  const visible = truncated
    ? prettyJson.slice(0, PAYLOAD_MAX_CHARS) +
      '\n\n[... payload truncated para exibição — o hash cobre o conteúdo completo]'
    : prettyJson

  const fmtDate = (iso: string) => {
    const d = new Date(iso)
    return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            padding: '32px 48px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: 14,
                letterSpacing: 4,
                color: '#94a3b8',
                textTransform: 'uppercase',
              }}
            >
              Evidência de Auditoria
            </div>
            <div
              style={{
                fontSize: 14,
                color: '#94a3b8',
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              Ativação de Ofertas
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8 }}>
            Log #{log.id.slice(0, 8)}
            <span style={{ color: '#64748b', fontWeight: 400 }}>
              {log.id.slice(8)}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 32,
              marginTop: 16,
              fontSize: 14,
              color: '#cbd5e1',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#64748b', fontSize: 11, letterSpacing: 1 }}>
                OCORRIDO EM
              </span>
              <span style={{ fontFamily: 'ui-monospace, monospace' }}>
                {fmtDate(log.created_at)}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#64748b', fontSize: 11, letterSpacing: 1 }}>
                CAPTURADO EM
              </span>
              <span style={{ fontFamily: 'ui-monospace, monospace' }}>
                {fmtDate(capturedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Metadata strip */}
        <div
          style={{
            display: 'flex',
            gap: 24,
            backgroundColor: '#f1f5f9',
            borderBottom: '1px solid #e2e8f0',
            padding: '20px 48px',
            fontSize: 14,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#64748b', fontSize: 11, letterSpacing: 1 }}>
              MÓDULO
            </span>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>
              {log.module ?? '—'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#64748b', fontSize: 11, letterSpacing: 1 }}>
              EVENTO
            </span>
            <span
              style={{
                fontFamily: 'ui-monospace, monospace',
                color: '#0f172a',
              }}
            >
              {log.event_name ?? '—'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#64748b', fontSize: 11, letterSpacing: 1 }}>
              USUÁRIO
            </span>
            <span
              style={{
                fontFamily: 'ui-monospace, monospace',
                color: '#0f172a',
              }}
            >
              {log.email ?? log.user ?? '—'}
            </span>
          </div>
        </div>

        {/* Payload */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            padding: '24px 48px',
          }}
        >
          <div
            style={{
              color: '#64748b',
              fontSize: 11,
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            PAYLOAD
          </div>
          <div
            style={{
              display: 'flex',
              backgroundColor: '#0f172a',
              borderRadius: 8,
              padding: 20,
              fontFamily: 'ui-monospace, monospace',
              fontSize: 13,
              color: '#e2e8f0',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              overflow: 'hidden',
              flex: 1,
            }}
          >
            {visible}
          </div>
        </div>

        {/* Footer with hash */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f8fafc',
            borderTop: '2px solid #0f172a',
            padding: '24px 48px',
            gap: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span
              style={{
                color: '#64748b',
                fontSize: 11,
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              SHA-256 (PAYLOAD)
            </span>
            <span
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 14,
                color: '#0f172a',
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
            >
              {formatHash(hash)}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 11,
              color: '#475569',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            verifique: sha256(JSON.stringify(payload)) do log id={log.id} na
            view logs_with_users
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 1600,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="audit-${log.id}-${log.created_at.slice(0, 10)}.png"`,
      },
    },
  )
}
