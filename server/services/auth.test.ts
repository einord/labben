import { describe, it, expect, beforeAll } from 'vitest'
import { seal, defaults } from 'iron-webcrypto'
import crypto from 'uncrypto'

// Set a known session secret BEFORE importing authService,
// so it uses this deterministic password instead of a random one.
const TEST_SESSION_SECRET = 'test-session-secret-that-is-long-enough-for-iron'
process.env.AUTH_SESSION_SECRET = TEST_SESSION_SECRET

// Must be imported AFTER setting env — authService reads it at init
const { authService } = await import('./auth')

const SESSION_NAME = 'labben-auth'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days, matching authService config

/**
 * Create a sealed session cookie string matching h3's internal format.
 */
async function createSealedCookie(data: Record<string, unknown>, password: string, maxAge: number): Promise<string> {
  const session = { data, createdAt: Date.now() }
  return await seal(crypto, session, password, {
    ...defaults,
    ttl: maxAge * 1000,
  })
}

describe('authService.getSessionUserIdFromCookie', () => {
  it('returns userId from a valid sealed session cookie', async () => {
    const sealed = await createSealedCookie({ userId: 'user-123' }, TEST_SESSION_SECRET, MAX_AGE)
    const cookieHeader = `${SESSION_NAME}=${sealed}`

    const result = await authService.getSessionUserIdFromCookie(cookieHeader)
    expect(result).toBe('user-123')
  })

  it('returns null when the cookie header is empty', async () => {
    const result = await authService.getSessionUserIdFromCookie('')
    expect(result).toBeNull()
  })

  it('returns null when the session cookie is missing from header', async () => {
    const cookieHeader = 'other-cookie=some-value; another=test'
    const result = await authService.getSessionUserIdFromCookie(cookieHeader)
    expect(result).toBeNull()
  })

  it('returns null for a corrupted cookie value', async () => {
    const cookieHeader = `${SESSION_NAME}=corrupted-garbage-value`
    const result = await authService.getSessionUserIdFromCookie(cookieHeader)
    expect(result).toBeNull()
  })

  it('returns null for a cookie sealed with wrong password', async () => {
    const wrongPassword = 'wrong-password-that-is-also-long-enough-for-iron!!'
    const sealed = await createSealedCookie({ userId: 'user-123' }, wrongPassword, MAX_AGE)
    const cookieHeader = `${SESSION_NAME}=${sealed}`

    const result = await authService.getSessionUserIdFromCookie(cookieHeader)
    expect(result).toBeNull()
  })

  it('returns null when session data has no userId', async () => {
    const sealed = await createSealedCookie({}, TEST_SESSION_SECRET, MAX_AGE)
    const cookieHeader = `${SESSION_NAME}=${sealed}`

    const result = await authService.getSessionUserIdFromCookie(cookieHeader)
    expect(result).toBeNull()
  })

  it('handles cookie header with multiple cookies correctly', async () => {
    const sealed = await createSealedCookie({ userId: 'user-456' }, TEST_SESSION_SECRET, MAX_AGE)
    const cookieHeader = `theme=dark; ${SESSION_NAME}=${sealed}; lang=en`

    const result = await authService.getSessionUserIdFromCookie(cookieHeader)
    expect(result).toBe('user-456')
  })
})
