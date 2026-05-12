import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'

export default defineConfig({
  test: {
    alias: {
      'server-only': fileURLToPath(
        new URL('./tests/__mocks__/server-only.ts', import.meta.url),
      ),
    },
  },
})
