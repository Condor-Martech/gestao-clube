import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath } from 'url'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // Baseline env so `lib/env.ts` schema validation passes on import.
    // Only the required (non-optional) vars — see lib/env.ts.
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
      STRAPI_API_URL: 'http://localhost:1337',
      STRAPI_API_TOKEN: 'test-strapi-token',
    },
    alias: {
      'server-only': fileURLToPath(new URL('./tests/__mocks__/server-only.ts', import.meta.url)),
    },
  },
})
