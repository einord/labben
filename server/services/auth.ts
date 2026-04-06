import { randomBytes } from 'node:crypto'
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server'
import type { H3Event } from 'h3'
import { useSession, unsealSession } from 'h3'
import { databaseService } from './database'

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

/**
 * Get or create a stable session password.
 * Priority: env var > persisted file > generated (with warning).
 */
function getSessionPassword(): string {
  if (process.env.AUTH_SESSION_SECRET) return process.env.AUTH_SESSION_SECRET

  const dataDir = process.env.NODE_ENV === 'production' ? '/data/db' : (process.env.DATA_DIR || 'data')
  const secretPath = resolve(dataDir, '.session-secret')

  // Try to read a previously persisted secret
  try {
    if (existsSync(secretPath)) {
      const stored = readFileSync(secretPath, 'utf-8').trim()
      if (stored.length >= 32) return stored
    }
  } catch {
    // Fall through to generation
  }

  // Generate and persist a new secret
  const generated = randomBytes(32).toString('hex')
  try {
    writeFileSync(secretPath, generated, { mode: 0o600 })
  } catch {
    console.warn('[auth] WARNING: Could not persist session secret to disk. Sessions will be invalidated on restart. Set AUTH_SESSION_SECRET env var for stable sessions.')
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn('[auth] WARNING: AUTH_SESSION_SECRET is not set. A generated secret has been persisted to disk. For best security, set AUTH_SESSION_SECRET explicitly.')
  }

  return generated
}

// Survive HMR reloads
const globalKey = '__labben_session_password'
const g = globalThis as unknown as Record<string, string | undefined>
const SESSION_PASSWORD = g[globalKey] ??= getSessionPassword()

interface ChallengeEntry {
  challenge: string
  userId?: string
  expiresAt: number
}

class AuthService {
  private rpName = 'Labben'
  private rpID: string
  private origin: string
  private challenges = new Map<string, ChallengeEntry>()

  constructor() {
    this.rpID = process.env.AUTH_RP_ID || 'localhost'
    this.origin = process.env.AUTH_ORIGIN || 'http://localhost:3005'

    // Clean up expired challenges and sessions periodically
    setInterval(() => {
      this.cleanupChallenges()
      databaseService.deleteExpiredSessions()
    }, 60_000)
  }

  /** Check if initial setup is required (no users exist) */
  isSetupRequired(): boolean {
    return databaseService.getUserCount() === 0
  }

  /** Generate WebAuthn registration options for a new user */
  async getRegistrationOptions(userId: string, username: string, displayName: string): Promise<PublicKeyCredentialCreationOptionsJSON> {
    const existingCredentials = databaseService.getCredentialsByUserId(userId)

    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      userName: username,
      userDisplayName: displayName,
      userID: new TextEncoder().encode(userId),
      attestationType: 'none',
      excludeCredentials: existingCredentials.map(c => ({
        id: c.id,
        transports: c.transports ? JSON.parse(c.transports) : undefined,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    })

    // Store challenge temporarily
    this.storeChallenge(userId, options.challenge)

    return options
  }

  /** Verify a registration response and store the credential */
  async verifyAndStoreRegistration(
    userId: string,
    response: RegistrationResponseJSON,
  ): Promise<boolean> {
    const entry = this.getChallenge(userId)
    if (!entry) throw new Error('Challenge not found or expired')

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: entry.challenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return false
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo

    databaseService.addCredential({
      id: credential.id,
      userId,
      publicKey: Buffer.from(credential.publicKey),
      counter: credential.counter,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: credential.transports ? JSON.stringify(credential.transports) : null,
    })

    this.removeChallenge(userId)
    return true
  }

  /** Generate WebAuthn authentication options */
  async getAuthenticationOptions(): Promise<{ options: PublicKeyCredentialRequestOptionsJSON; challengeKey: string }> {
    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      userVerification: 'preferred',
    })

    const challengeKey = `auth_${randomBytes(16).toString('hex')}`
    this.storeChallenge(challengeKey, options.challenge)

    return { options, challengeKey }
  }

  /** Verify an authentication response */
  async verifyAuthentication(
    challengeKey: string,
    response: AuthenticationResponseJSON,
  ): Promise<string | null> {
    const entry = this.getChallenge(challengeKey)
    if (!entry) throw new Error('Challenge not found or expired')

    const credential = databaseService.getCredentialById(response.id)
    if (!credential) throw new Error('Credential not found')

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: entry.challenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
      credential: {
        id: credential.id,
        publicKey: credential.publicKey,
        counter: credential.counter,
        transports: credential.transports ? JSON.parse(credential.transports) : undefined,
      },
    })

    if (!verification.verified) return null

    // Update counter
    databaseService.updateCredentialCounter(
      credential.id,
      verification.authenticationInfo.newCounter,
    )

    this.removeChallenge(challengeKey)
    return credential.userId
  }

  /** Shared session config */
  private getSessionConfig() {
    return {
      password: SESSION_PASSWORD,
      name: 'labben-auth',
      maxAge: SESSION_MAX_AGE_SECONDS,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
      },
    }
  }

  /** Create a session for a user, storing it in the database */
  async createSession(event: H3Event, userId: string): Promise<void> {
    const sessionId = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString()
    const userAgent = getHeader(event, 'user-agent') ?? null
    const ipAddress = getRequestIP(event, { xForwardedFor: true }) ?? null

    databaseService.createSession(sessionId, userId, expiresAt, userAgent, ipAddress)

    const session = await useSession(event, this.getSessionConfig())
    await session.update({ userId, sessionId })
  }

  /** Get the current session user ID, validating against the database */
  async getSessionUserId(event: H3Event): Promise<string | null> {
    const session = await useSession(event, this.getSessionConfig())
    const data = session.data as { userId?: string; sessionId?: string }
    if (!data?.userId || !data?.sessionId) return null

    // Validate session exists in DB and is not expired/revoked
    const dbSession = databaseService.getSession(data.sessionId)
    if (!dbSession || dbSession.userId !== data.userId) return null

    // Update last used timestamp (at most once per minute to reduce writes)
    databaseService.touchSession(data.sessionId)

    return data.userId
  }

  /** Get the current session ID from the cookie */
  async getSessionId(event: H3Event): Promise<string | null> {
    const session = await useSession(event, this.getSessionConfig())
    return (session.data as { sessionId?: string })?.sessionId ?? null
  }

  /** Destroy the current session (both cookie and DB record) */
  async destroySession(event: H3Event): Promise<void> {
    const session = await useSession(event, this.getSessionConfig())
    const data = session.data as { sessionId?: string }

    if (data?.sessionId) {
      databaseService.deleteSession(data.sessionId)
    }

    await session.clear()
  }

  /**
   * Rotate the session: destroy the old one and create a new one for the same user.
   * Used after sensitive operations like adding a passkey.
   */
  async rotateSession(event: H3Event, userId: string): Promise<void> {
    await this.destroySession(event)
    await this.createSession(event, userId)
  }

  /**
   * Validate a session from a raw cookie header string (for WebSocket auth).
   * Returns the userId if valid, null otherwise.
   */
  async getSessionUserIdFromCookie(cookieHeader: string): Promise<string | null> {
    const config = this.getSessionConfig()
    const cookieName = config.name
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [key, ...rest] = c.trim().split('=')
        return [key, rest.join('=')]
      }),
    )
    const sealed = cookies[cookieName]
    if (!sealed) return null

    try {
      // unsealSession's first param (_event) is unused internally by h3
      const unsealed = await unsealSession(null as never, config, sealed)
      const data = (unsealed as { data?: { userId?: string; sessionId?: string } })?.data
      if (!data?.userId || !data?.sessionId) return null

      // Validate against DB
      const dbSession = databaseService.getSession(data.sessionId)
      if (!dbSession || dbSession.userId !== data.userId) return null

      return data.userId
    } catch {
      return null
    }
  }

  /** Get all active sessions for a user, marking which one is current */
  getSessionsForUser(userId: string, currentSessionId: string | null): Array<{
    id: string
    userAgent: string | null
    ipAddress: string | null
    createdAt: string
    lastUsedAt: string
    isCurrent: boolean
  }> {
    const sessions = databaseService.getSessionsByUserId(userId)
    return sessions.map(s => ({
      ...s,
      isCurrent: s.id === currentSessionId,
    }))
  }

  /** Revoke a specific session (must belong to the user) */
  revokeSession(sessionId: string, userId: string): boolean {
    const session = databaseService.getSession(sessionId)
    if (!session || session.userId !== userId) return false
    databaseService.deleteSession(sessionId)
    return true
  }

  /** Revoke all sessions except the current one */
  revokeOtherSessions(userId: string, currentSessionId: string): number {
    return databaseService.deleteOtherSessions(userId, currentSessionId)
  }

  /** Generate a unique invite token */
  generateInviteToken(createdBy: string): { token: string; expiresAt: string } {
    const token = randomBytes(24).toString('base64url')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    databaseService.createInviteToken(token, createdBy, expiresAt)
    return { token, expiresAt }
  }

  // -- Private helpers --

  private static readonly MAX_ACTIVE_CHALLENGES = 100

  private storeChallenge(key: string, challenge: string): void {
    // Prevent memory exhaustion from excessive active challenges
    if (this.challenges.size >= AuthService.MAX_ACTIVE_CHALLENGES) {
      this.cleanupChallenges()
      if (this.challenges.size >= AuthService.MAX_ACTIVE_CHALLENGES) {
        throw createError({ statusCode: 429, message: 'Too many active challenges, please try again later' })
      }
    }

    this.challenges.set(key, {
      challenge,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    })
  }

  private getChallenge(key: string): ChallengeEntry | null {
    const entry = this.challenges.get(key)
    if (!entry || entry.expiresAt < Date.now()) {
      this.challenges.delete(key)
      return null
    }
    return entry
  }

  private removeChallenge(key: string): void {
    this.challenges.delete(key)
  }

  private cleanupChallenges(): void {
    const now = Date.now()
    for (const [key, entry] of this.challenges) {
      if (entry.expiresAt < now) this.challenges.delete(key)
    }
  }
}

// Persist across HMR reloads in development
const globalForAuth = globalThis as typeof globalThis & { __authService?: AuthService }
export const authService = globalForAuth.__authService ??= new AuthService()
