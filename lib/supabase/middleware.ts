import 'server-only'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  ALWAYS_VISIBLE_PREFIXES,
  ROUTE_MODULE_MAP,
  hasModuleAccess,
  type Module,
  type ModuleRoles,
} from '@/lib/rbac'

// Public paths — reachable without an authenticated session.
const PUBLIC_PREFIXES = ['/login', '/forgot-password', '/reset-password', '/auth/confirm']

// Authenticated paths that are not gated by any module (e.g. root redirect,
// account settings if added later). Listed explicitly to keep the strict
// gate honest — anything not in PUBLIC, AUTH_FREE, ALWAYS_VISIBLE or
// ROUTE_MODULE_MAP is denied.
const AUTH_FREE_DASHBOARD_PATHS = new Set<string>(['/'])

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || pathname.startsWith('/api/auth')
  )
}

function isAlwaysVisible(pathname: string): boolean {
  return ALWAYS_VISIBLE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function matchModule(pathname: string): Module | null {
  return ROUTE_MODULE_MAP.find(({ prefix }) => pathname.startsWith(prefix))?.module ?? null
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: nothing between createServerClient and getClaims() — bug-prone.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims
  const pathname = request.nextUrl.pathname

  // Unauthenticated → public paths pass; everything else redirects to login.
  if (!user) {
    if (isPublicPath(pathname)) return supabaseResponse
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Authenticated user hitting /login → bounce to dashboard.
  if (pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Public paths (e.g. /auth/confirm finishing an invite) pass through even
  // if a session already exists.
  if (isPublicPath(pathname)) return supabaseResponse

  // Skip authorization for explicit auth-free dashboard paths and always-visible
  // prefixes (dashboard, ajuda).
  if (AUTH_FREE_DASHBOARD_PATHS.has(pathname) || isAlwaysVisible(pathname)) {
    return supabaseResponse
  }

  // From here on we need the user's role + per-module access.
  const userId = user.sub as string | undefined
  if (!userId) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const [{ data: profile }, { data: userSystem }] = await Promise.all([
    supabase.from('profiles').select('role').eq('user', userId).single(),
    supabase.from('user_module_roles').select('module_roles').eq('user_id', userId).single(),
  ])

  const isAdmin = profile?.role === 'admin'
  const moduleRoles = (userSystem?.module_roles ?? {}) as ModuleRoles

  // Admin bypass — everything is allowed.
  if (isAdmin) return supabaseResponse

  const module = matchModule(pathname)

  // Strict mode: unmapped routes are denied for non-admins. This forces every
  // new feature to be declared explicitly in ROUTE_MODULE_MAP.
  if (!module) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (!hasModuleAccess(isAdmin, module, moduleRoles)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
