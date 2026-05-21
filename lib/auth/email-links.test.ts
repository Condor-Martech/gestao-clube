import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { generateAuthLink } from './email-links'

/** Builds a stub admin client whose generateLink resolves to `response`. */
function makeAdmin(response: unknown) {
  const generateLink = vi.fn().mockResolvedValue(response)
  const admin = { auth: { admin: { generateLink } } } as unknown as SupabaseClient
  return { admin, generateLink }
}

const okResponse = (hashedToken: string, userId: string) => ({
  data: { properties: { hashed_token: hashedToken }, user: { id: userId } },
  error: null,
})

describe('generateAuthLink', () => {
  it('invite — builds an /auth/confirm URL with the token and welcome target', async () => {
    const { admin, generateLink } = makeAdmin(okResponse('tok_invite', 'user-123'))

    const result = await generateAuthLink({
      admin,
      type: 'invite',
      email: 'novo@condor.com.br',
      data: { role: 'user' },
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.userId).toBe('user-123')
    const url = new URL(result.url)
    expect(url.pathname).toBe('/auth/confirm')
    expect(url.searchParams.get('token_hash')).toBe('tok_invite')
    expect(url.searchParams.get('type')).toBe('invite')
    expect(url.searchParams.get('next')).toBe('/reset-password?welcome=1')

    expect(generateLink).toHaveBeenCalledWith({
      type: 'invite',
      email: 'novo@condor.com.br',
      options: { data: { role: 'user' } },
    })
  })

  it('recovery — uses the plain reset target and passes no options', async () => {
    const { admin, generateLink } = makeAdmin(okResponse('tok_recovery', 'user-456'))

    const result = await generateAuthLink({
      admin,
      type: 'recovery',
      email: 'existe@condor.com.br',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const url = new URL(result.url)
    expect(url.searchParams.get('type')).toBe('recovery')
    expect(url.searchParams.get('next')).toBe('/reset-password')
    expect(generateLink).toHaveBeenCalledWith({
      type: 'recovery',
      email: 'existe@condor.com.br',
    })
  })

  it('invite without metadata passes options as undefined', async () => {
    const { admin, generateLink } = makeAdmin(okResponse('tok', 'u'))

    await generateAuthLink({ admin, type: 'invite', email: 'a@b.com' })

    expect(generateLink).toHaveBeenCalledWith({
      type: 'invite',
      email: 'a@b.com',
      options: undefined,
    })
  })

  it('returns ok:false with the error message when generateLink fails', async () => {
    const { admin } = makeAdmin({
      data: { properties: null, user: null },
      error: { message: 'User not found' },
    })

    const result = await generateAuthLink({
      admin,
      type: 'recovery',
      email: 'desconhecido@condor.com.br',
    })

    expect(result).toEqual({ ok: false, error: 'User not found' })
  })
})
