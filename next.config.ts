import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import { version } from './package.json'

const withNextIntl = createNextIntlPlugin()

const strapiHost = (() => {
  if (!process.env.STRAPI_API_URL) return null
  try {
    return new URL(process.env.STRAPI_API_URL).hostname
  } catch {
    return null
  }
})()

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  typedRoutes: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'stage.z0n.co' },
      ...(strapiHost ? [{ protocol: 'https' as const, hostname: strapiHost }] : []),
    ],
  },
  allowedDevOrigins: ['10.1.2.62'],
  reactCompiler: false,
  // PostHog reverse proxy: os requests do SDK saem do nosso domínio (/ingest)
  // em vez de baterem direto em posthog.com — evita bloqueio por adblockers.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ]
  },
}

export default withNextIntl(nextConfig)
