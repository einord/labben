import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { seal, defaults } from 'iron-webcrypto'
import crypto from 'uncrypto'
import { randomBytes } from 'node:crypto'

// Set a known session secret BEFORE importing authService,
// so it uses this deterministic password instead of a random one.
const TEST_SESSION_SECRET = 'test-session-secret-that-is-long-enough-for-iron'
process.env.AUTH_SESSION_SECRET = TEST_SESSION_SECRET

// Must be imported AFTER setting env — authService reads it at init
const { authService } = await import('./auth')
const { databaseService } = await import('./database')

const SESSION_NAME = 'labben-auth'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days, matching authService config

/** Format a Date as SQLite-compatible datetime string (YYYY-MM-DD HH:MM:SS) */
function toSqliteDatetime(date: Date): string {
  return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '')
}

/**
 * Create a sealed session cookie string matching h3's internal format.
 */
async function createSealedCookie(data: Record<string, unknown>, password: string, maxAge: number): Promise<string> {
  const session = { data, createdAt: Date.now() }
  return await seal(crypto as Parameters<typeof seal>[0], session, password, {
    ...defaults,
    ttl: maxAge * 1000,
  })
}

/** Create a test user and session in the DB, returning both IDs */
function createTestSession(userId: string): string {
  // Ensure user exists
  try {
    databaseService.createUser(userId, `user-${userId}`, `User ${userId}`)
  } catch {
    // User may already exist
  }
  const sessionId = randomBytes(32).toString('hex')
  const expiresAt = toSqliteDatetime(new Date(Date.now() + MAX_AGE * 1000))
  databaseService.createSession(sessionId, userId, expiresAt, 'Test Agent', '127.0.0.1')
  return sessionId
}

describe('authService.getSessionUserIdFromCookie', () => {
  let testSessionId: string

  beforeAll(() => {
    testSessionId = createTestSession('user-123')
  })

  it('returns userId from a valid sealed session cookie with DB-backed session', async () => {
    const sealed = await createSealedCookie({ userId: 'user-123', sessionId: testSessionId }, TEST_SESSION_SECRET, MAX_AGE)
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
    const sealed = await createSealedCookie({ userId: 'user-123', sessionId: testSessionId }, wrongPassword, MAX_AGE)
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

  it('returns null when session data has no sessionId', async () => {
    const sealed = await createSealedCookie({ userId: 'user-123' }, TEST_SESSION_SECRET, MAX_AGE)
    const cookieHeader = `${SESSION_NAME}=${sealed}`

    const result = await authService.getSessionUserIdFromCookie(cookieHeader)
    expect(result).toBeNull()
  })

  it('returns null when session ID is not found in DB (revoked)', async () => {
    const fakeSessionId = randomBytes(32).toString('hex')
    const sealed = await createSealedCookie({ userId: 'user-123', sessionId: fakeSessionId }, TEST_SESSION_SECRET, MAX_AGE)
    const cookieHeader = `${SESSION_NAME}=${sealed}`

    const result = await authService.getSessionUserIdFromCookie(cookieHeader)
    expect(result).toBeNull()
  })

  it('handles cookie header with multiple cookies correctly', async () => {
    const sessionId456 = createTestSession('user-456')
    const sealed = await createSealedCookie({ userId: 'user-456', sessionId: sessionId456 }, TEST_SESSION_SECRET, MAX_AGE)
    const cookieHeader = `theme=dark; ${SESSION_NAME}=${sealed}; lang=en`

    const result = await authService.getSessionUserIdFromCookie(cookieHeader)
    expect(result).toBe('user-456')
  })
})

describe('session DB operations', () => {
  const userId = 'session-test-user'

  beforeAll(() => {
    try {
      databaseService.createUser(userId, 'session-test', 'Session Test')
    } catch {
      // May already exist
    }
  })

  it('creates and retrieves a session', () => {
    const sessionId = randomBytes(32).toString('hex')
    const expiresAt = toSqliteDatetime(new Date(Date.now() + 3600_000))
    databaseService.createSession(sessionId, userId, expiresAt, 'Mozilla/5.0', '10.0.0.1')

    const session = databaseService.getSession(sessionId)
    expect(session).not.toBeNull()
    expect(session!.userId).toBe(userId)
    expect(session!.userAgent).toBe('Mozilla/5.0')
    expect(session!.ipAddress).toBe('10.0.0.1')
  })

  it('returns null for expired sessions', () => {
    const sessionId = randomBytes(32).toString('hex')
    const expiredAt = toSqliteDatetime(new Date(Date.now() - 1000))
    databaseService.createSession(sessionId, userId, expiredAt, null, null)

    const session = databaseService.getSession(sessionId)
    expect(session).toBeNull()
  })

  it('deletes a specific session', () => {
    const sessionId = randomBytes(32).toString('hex')
    const expiresAt = toSqliteDatetime(new Date(Date.now() + 3600_000))
    databaseService.createSession(sessionId, userId, expiresAt, null, null)

    databaseService.deleteSession(sessionId)
    expect(databaseService.getSession(sessionId)).toBeNull()
  })

  it('deletes other sessions keeping one', () => {
    const keepId = randomBytes(32).toString('hex')
    const otherId1 = randomBytes(32).toString('hex')
    const otherId2 = randomBytes(32).toString('hex')
    const expiresAt = toSqliteDatetime(new Date(Date.now() + 3600_000))

    databaseService.createSession(keepId, userId, expiresAt, null, null)
    databaseService.createSession(otherId1, userId, expiresAt, null, null)
    databaseService.createSession(otherId2, userId, expiresAt, null, null)

    const count = databaseService.deleteOtherSessions(userId, keepId)
    expect(count).toBeGreaterThanOrEqual(2)
    expect(databaseService.getSession(keepId)).not.toBeNull()
    expect(databaseService.getSession(otherId1)).toBeNull()
    expect(databaseService.getSession(otherId2)).toBeNull()
  })

  it('lists sessions for a user', () => {
    // Clean up first
    databaseService.deleteAllUserSessions(userId)

    const id1 = randomBytes(32).toString('hex')
    const id2 = randomBytes(32).toString('hex')
    const expiresAt = toSqliteDatetime(new Date(Date.now() + 3600_000))
    databaseService.createSession(id1, userId, expiresAt, 'Chrome', '1.1.1.1')
    databaseService.createSession(id2, userId, expiresAt, 'Firefox', '2.2.2.2')

    const sessions = databaseService.getSessionsByUserId(userId)
    expect(sessions.length).toBe(2)
  })

  it('cleans up expired sessions', () => {
    const expiredId = randomBytes(32).toString('hex')
    const validId = randomBytes(32).toString('hex')
    databaseService.createSession(expiredId, userId, toSqliteDatetime(new Date(Date.now() - 1000)), null, null)
    databaseService.createSession(validId, userId, toSqliteDatetime(new Date(Date.now() + 3600_000)), null, null)

    const cleaned = databaseService.deleteExpiredSessions()
    expect(cleaned).toBeGreaterThanOrEqual(1)
    expect(databaseService.getSession(validId)).not.toBeNull()
  })
})

describe('authService session management', () => {
  const userId = 'revoke-test-user'

  beforeAll(() => {
    try {
      databaseService.createUser(userId, 'revoke-test', 'Revoke Test')
    } catch {
      // May already exist
    }
  })

  it('revokes a session belonging to the user using truncated ID', () => {
    const sessionId = randomBytes(32).toString('hex')
    databaseService.createSession(sessionId, userId, toSqliteDatetime(new Date(Date.now() + 3600_000)), null, null)

    const truncatedId = sessionId.substring(0, 16)
    const result = authService.revokeSession(truncatedId, userId)
    expect(result).toBe(true)
    expect(databaseService.getSession(sessionId)).toBeNull()
  })

  it('refuses to revoke a session belonging to another user', () => {
    const sessionId = randomBytes(32).toString('hex')
    databaseService.createSession(sessionId, userId, toSqliteDatetime(new Date(Date.now() + 3600_000)), null, null)

    const truncatedId = sessionId.substring(0, 16)
    const result = authService.revokeSession(truncatedId, 'other-user')
    expect(result).toBe(false)
    expect(databaseService.getSession(sessionId)).not.toBeNull()

    // Cleanup
    databaseService.deleteSession(sessionId)
  })

  it('returns false for non-existent session', () => {
    const result = authService.revokeSession('nonexistent12345', userId)
    expect(result).toBe(false)
  })

  it('getSessionsForUser returns truncated IDs and marks current correctly', () => {
    databaseService.deleteAllUserSessions(userId)

    const current = randomBytes(32).toString('hex')
    const other = randomBytes(32).toString('hex')
    const expiresAt = toSqliteDatetime(new Date(Date.now() + 3600_000))
    databaseService.createSession(current, userId, expiresAt, 'Chrome', null)
    databaseService.createSession(other, userId, expiresAt, 'Firefox', null)

    const sessions = authService.getSessionsForUser(userId, current)
    expect(sessions.length).toBe(2)

    // IDs should be truncated to 16 chars
    const currentSession = sessions.find(s => s.isCurrent)!
    expect(currentSession.id).toBe(current.substring(0, 16))
    expect(currentSession.id.length).toBe(16)

    const otherSession = sessions.find(s => !s.isCurrent)!
    expect(otherSession.id).toBe(other.substring(0, 16))
    expect(otherSession.isCurrent).toBe(false)
  })
})
