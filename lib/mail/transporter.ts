import 'server-only'
import nodemailer, { type Transporter } from 'nodemailer'
import { env } from '@/lib/env'

let cached: Transporter | null = null

/**
 * Lazily builds a singleton SMTP transporter from the MAIL_* env vars.
 * Throws if the SMTP credentials aren't configured — callers should guard
 * with a friendly message before reaching this point.
 */
export function getTransporter(): Transporter {
  if (cached) return cached

  if (!env.MAIL_SMTP || !env.APP_MAIL_USER || !env.APP_MAIL_PASS) {
    throw new Error(
      'SMTP não configurado — defina MAIL_SMTP, APP_MAIL_USER e APP_MAIL_PASS no .env.local',
    )
  }

  cached = nodemailer.createTransport({
    host: env.MAIL_SMTP,
    port: env.MAIL_PORT,
    secure: env.MAIL_SECURE,
    auth: {
      user: env.APP_MAIL_USER,
      pass: env.APP_MAIL_PASS,
    },
  })

  return cached
}
