/** Stored NPM API credentials */
export interface NpmCredentials {
  url: string
  email: string
  password: string
}

/** NPM connection status */
export interface NpmConnectionStatus {
  connected: boolean
  url: string | null
  email: string | null
  isDefault: boolean
}

/** NPM proxy host entry */
export interface NpmProxyHost {
  id: number
  domainNames: string[]
  forwardHost: string
  forwardPort: number
  forwardScheme: string
  enabled: boolean
  sslForced: boolean
  certificateId: number
  meta: Record<string, unknown>
}

/** NPM token response from POST /api/tokens */
export interface NpmTokenResponse {
  token: string
  expires: string
}

/** NPM user object */
export interface NpmUser {
  id: number
  email: string
  name: string
  nickname: string
  roles: string[]
}
