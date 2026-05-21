import 'server-only'
import { z } from 'zod'

const envSchema = z.object({
  // Public — browser-safe
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_').optional(),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // Server-only
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  EVOLUTION_API_URL: z.string().url().optional(),
  EVOLUTION_API_KEY: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  CONDOR_WEBHOOK_BASE: z.string().url().optional(),
  CONDOR_WEBHOOK_SECRET: z.string().optional(),

  // Strapi — backend for banner-super-app and numero-da-sorte features
  STRAPI_API_URL: z.string().url(),
  STRAPI_API_TOKEN: z.string().min(1),

  // Clube Condor — Stores Intelligence
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  OPENAI_MODEL_REVIEW_ANALYSIS: z.string().min(1).default('gpt-4o-mini'),
  OPENAI_MODEL_EXECUTIVE_SUMMARY: z.string().min(1).default('gpt-4o'),
  GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: z.string().min(1).optional(),
  APP_STORE_CONNECT_KEY_ID: z.string().min(1).optional(),
  APP_STORE_CONNECT_ISSUER_ID: z.string().uuid().optional(),
  APP_STORE_CONNECT_PRIVATE_KEY: z.string().min(1).optional(),
  STORES_SYNC_THROTTLE_MINUTES: z.coerce.number().int().positive().default(60),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Treat empty strings as undefined so `.optional()` validators don't trip on
// vars present-but-blank in .env.local (e.g. `APP_STORE_CONNECT_ISSUER_ID=`).
const rawEnv = Object.fromEntries(
  Object.entries(process.env).map(([k, v]) => [k, v === '' ? undefined : v]),
)

const parsed = envSchema.safeParse(rawEnv)

if (!parsed.success) {
  const fieldErrors = parsed.error.flatten().fieldErrors
  console.error('❌ Invalid environment variables:', fieldErrors)
  const summary = Object.entries(fieldErrors)
    .map(([key, errs]) => `${key}: ${(errs ?? []).join(', ')}`)
    .join(' | ')
  throw new Error(`Invalid environment variables — ${summary} — see docs/08_ENV_CONFIG.md`)
}

export const env = parsed.data
export type Env = z.infer<typeof envSchema>
