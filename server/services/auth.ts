import { randomBytes } from 'node:crypto'
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

/** Get or create a stable session password that survives HMR reloads */
function getSessionPassword(): string {
  if (process.env.AUTH_SESSION_SECRET) return process.env.AUTH_SESSION_SECRET

  const globalKey = '__labben_session_password'
  const g = globalThis as Record<string, string | undefined>
  if (!g[globalKey]) {
    g[globalKey] = randomBytes(32).toString('hex')
  }
  return g[globalKey]
}

const SESSION_PASSWORD = getSessionPassword()

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

    // Clean up expired challenges periodically
    setInterval(() => this.cleanupChallenges(), 60_000)
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
      maxAge: 60 * 60 * 24 * 30, // 30 days
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
      },
    }
  }

  /** Create a session for a user */
  async createSession(event: H3Event, userId: string): Promise<void> {
    const session = await useSession(event, this.getSessionConfig())
    await session.update({ userId })
  }

  /** Get the current session user ID */
  async getSessionUserId(event: H3Event): Promise<string | null> {
    const session = await useSession(event, this.getSessionConfig())
    return (session.data as { userId?: string })?.userId ?? null
  }

  /** Destroy the current session */
  async destroySession(event: H3Event): Promise<void> {
    const session = await useSession(event, this.getSessionConfig())
    await session.clear()
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
      const unsealed = await unsealSession(null as never, config, sealed)
      return (unsealed as { userId?: string })?.userId ?? null
    } catch {
      return null
    }
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
