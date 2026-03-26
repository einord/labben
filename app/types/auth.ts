/** A user account */
export interface User {
  id: string
  username: string
  displayName: string
  createdAt?: string
}

/** Info about a registered WebAuthn credential (for display in UI) */
export interface WebAuthnCredentialInfo {
  id: string
  deviceType: string | null
  backedUp: boolean
  createdAt: string
}

/** An invitation to create an account */
export interface InviteInfo {
  token: string
  url: string
  expiresAt: string
}

/** Auth state returned to the client */
export interface AuthState {
  user: User | null
  isSetup: boolean
}
