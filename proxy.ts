import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    // `ingest` é o reverse proxy do PostHog (next.config rewrites) — excluído
    // do auth para que os requests do SDK não sejam redirecionados ao /login.
    '/((?!api|ingest|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
