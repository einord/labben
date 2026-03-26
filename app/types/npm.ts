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

/** Data for creating or updating a proxy host in NPM */
export interface CreateProxyHostData {
  domainNames: string[]
  forwardScheme: 'http' | 'https'
  forwardHost: string
  forwardPort: number
  sslForced: boolean
  allowWebsocketUpgrade: boolean
  blockExploits: boolean
  http2Support: boolean
  meta?: Record<string, unknown>
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
