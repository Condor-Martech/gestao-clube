import { describe, expect, it } from 'vitest'
import { ForgotPasswordSchema, ResetPasswordSchema } from './auth'

describe('ForgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    expect(ForgotPasswordSchema.safeParse({ email: 'user@condor.com.br' }).success).toBe(true)
  })

  it('rejects an invalid email', () => {
    expect(ForgotPasswordSchema.safeParse({ email: 'not-an-email' }).success).toBe(false)
  })

  it('rejects an empty email', () => {
    expect(ForgotPasswordSchema.safeParse({ email: '' }).success).toBe(false)
  })
})

describe('ResetPasswordSchema', () => {
  it('accepts matching passwords of at least 8 chars', () => {
    const result = ResetPasswordSchema.safeParse({
      password: 'segura123',
      confirmPassword: 'segura123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects passwords shorter than 8 chars', () => {
    const result = ResetPasswordSchema.safeParse({
      password: 'curta',
      confirmPassword: 'curta',
    })
    expect(result.success).toBe(false)
  })

  it('rejects when the two passwords do not match', () => {
    const result = ResetPasswordSchema.safeParse({
      password: 'segura123',
      confirmPassword: 'outra4567',
    })
    expect(result.success).toBe(false)
    if (result.success) return
    // The mismatch error must be attributed to the confirmation field.
    expect(result.error.issues[0]?.path).toEqual(['confirmPassword'])
  })
})
