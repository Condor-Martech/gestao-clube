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
      ...(strapiHost
        ? [{ protocol: 'https' as const, hostname: strapiHost }]
        : []),
    ],
  },
  allowedDevOrigins: ['10.1.2.62'],
  experimental: {
    reactCompiler: false,
  },
}

export default withNextIntl(nextConfig)
