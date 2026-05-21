import { describe, expect, it } from 'vitest'
import { inviteEmail, recoveryEmail } from './templates'

const ACTION_URL = 'https://app.condor.com.br/auth/confirm?token_hash=abc123&type=invite'

describe('inviteEmail', () => {
  it('has an invite-related subject', () => {
    expect(inviteEmail({ actionUrl: ACTION_URL }).subject).toMatch(/convidado/i)
  })

  it('embeds the action URL in both the HTML and the plain-text body', () => {
    const email = inviteEmail({ actionUrl: ACTION_URL })
    expect(email.html).toContain(ACTION_URL)
    expect(email.text).toContain(ACTION_URL)
  })

  it('renders a complete, branded HTML document', () => {
    const email = inviteEmail({ actionUrl: ACTION_URL })
    expect(email.html).toContain('<!doctype html>')
    expect(email.html).toContain('Clube Condor')
  })
})

describe('recoveryEmail', () => {
  it('has a password-reset subject', () => {
    expect(recoveryEmail({ actionUrl: ACTION_URL }).subject).toMatch(/senha/i)
  })

  it('embeds the action URL in both the HTML and the plain-text body', () => {
    const email = recoveryEmail({ actionUrl: ACTION_URL })
    expect(email.html).toContain(ACTION_URL)
    expect(email.text).toContain(ACTION_URL)
  })
})
