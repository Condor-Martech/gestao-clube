import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockEnv = { GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: undefined as string | undefined }
vi.mock('@/lib/env', () => ({ env: mockEnv }))

import { getPlayAuth, __resetPlayAuthCache } from './play-store-auth'
import { StoreProviderError } from '../types'

const VALID_SA_JSON = JSON.stringify({
  type: 'service_account',
  project_id: 'test-project',
  private_key_id: 'abc',
  private_key: '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----\n',
  client_email: 'test@test-project.iam.gserviceaccount.com',
  client_id: '123',
  token_uri: 'https://oauth2.googleapis.com/token',
})

describe('play-store-auth', () => {
  beforeEach(() => {
    __resetPlayAuthCache()
    mockEnv.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON = undefined
  })

  it('throws MISSING_CREDENTIALS when env var is undefined', () => {
    expect(() => getPlayAuth()).toThrow(StoreProviderError)
    try {
      getPlayAuth()
    } catch (e) {
      expect((e as StoreProviderError).code).toBe('MISSING_CREDENTIALS')
    }
  })

  it('throws AUTH_FAILED when service account JSON is malformed', () => {
    mockEnv.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON = '{not valid json'
    expect(() => getPlayAuth()).toThrow(StoreProviderError)
    try {
      getPlayAuth()
    } catch (e) {
      expect((e as StoreProviderError).code).toBe('AUTH_FAILED')
    }
  })

  it('returns a GoogleAuth instance when env is valid', () => {
    mockEnv.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON = VALID_SA_JSON
    const auth = getPlayAuth()
    expect(auth).toBeDefined()
  })

  it('caches the auth instance across calls', () => {
    mockEnv.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON = VALID_SA_JSON
    const first = getPlayAuth()
    const second = getPlayAuth()
    expect(first).toBe(second)
  })

  it('produces a fresh instance after cache reset', () => {
    mockEnv.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON = VALID_SA_JSON
    const first = getPlayAuth()
    __resetPlayAuthCache()
    const second = getPlayAuth()
    expect(first).not.toBe(second)
  })
})
