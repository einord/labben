import type { NpmConnectionStatus, NpmCredentials, NpmProxyHost, NpmTokenResponse, NpmUser } from '~/types/npm'
import { databaseService } from './database'

const NPM_DEFAULT_PASSWORD = 'changeme'

class NpmApiService {
  private cachedToken: string | null = null

  /** Get stored credentials from the database */
  getCredentials(): NpmCredentials | null {
    const url = databaseService.getSetting('npm_api_url')
    const email = databaseService.getSetting('npm_email')
    const password = databaseService.getSetting('npm_password')
    if (!url || !email || !password) return null
    return { url, email, password }
  }

  /** Save credentials to the database */
  saveCredentials(url: string, email: string, password: string): void {
    databaseService.setSetting('npm_api_url', url)
    databaseService.setSetting('npm_email', email)
    databaseService.setSetting('npm_password', password)
    this.cachedToken = null
  }

  /** Clear stored credentials and token */
  clearCredentials(): void {
    databaseService.deleteSetting('npm_api_url')
    databaseService.deleteSetting('npm_email')
    databaseService.deleteSetting('npm_password')
    databaseService.deleteSetting('npm_token')
    this.cachedToken = null
  }

  /** Check if stored credentials use the default password */
  isDefaultPassword(): boolean {
    const creds = this.getCredentials()
    if (!creds) return false
    return creds.password === NPM_DEFAULT_PASSWORD
  }

  /** Test connection by attempting login with given credentials */
  async testConnection(url: string, email: string, password: string): Promise<boolean> {
    try {
      await this.login(url, email, password)
      return true
    } catch {
      return false
    }
  }

  /** Get the connection status */
  async getStatus(): Promise<NpmConnectionStatus> {
    const creds = this.getCredentials()
    if (!creds) {
      return { connected: false, url: null, email: null, isDefault: false }
    }

    const connected = await this.testConnection(creds.url, creds.email, creds.password)
    return {
      connected,
      url: creds.url,
      email: creds.email,
      isDefault: creds.password === NPM_DEFAULT_PASSWORD,
    }
  }

  /** Login to NPM and get a JWT token */
  private async login(url: string, email: string, password: string): Promise<string> {
    const response = await $fetch<NpmTokenResponse>(`${url}/api/tokens`, {
      method: 'POST',
      body: { identity: email, secret: password },
    })
    return response.token
  }

  /** Get a valid token, using cache or refreshing as needed */
  async getToken(): Promise<string> {
    if (this.cachedToken) {
      return this.cachedToken
    }

    // Try stored token
    const storedToken = databaseService.getSetting('npm_token')
    if (storedToken) {
      this.cachedToken = storedToken
      return storedToken
    }

    // Login with stored credentials
    const creds = this.getCredentials()
    if (!creds) throw new Error('No NPM credentials configured')

    const token = await this.login(creds.url, creds.email, creds.password)
    this.cachedToken = token
    databaseService.setSetting('npm_token', token)
    return token
  }

  /** Make an authenticated API request to NPM, with automatic token refresh on 401 */
  async apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
    const creds = this.getCredentials()
    if (!creds) throw new Error('No NPM credentials configured')

    const url = `${creds.url}/api${path}`

    try {
      const token = await this.getToken()
      return await $fetch<T>(url, {
        method: method as 'GET' | 'POST' | 'PUT' | 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        body: body ?? undefined,
      })
    } catch (error: unknown) {
      // On 401, try refreshing the token once
      if (this.isUnauthorized(error)) {
        this.cachedToken = null
        databaseService.deleteSetting('npm_token')
        const token = await this.login(creds.url, creds.email, creds.password)
        this.cachedToken = token
        databaseService.setSetting('npm_token', token)

        return await $fetch<T>(url, {
          method: method as 'GET' | 'POST' | 'PUT' | 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
          body: body ?? undefined,
        })
      }
      throw error
    }
  }

  /** Change the password for the current NPM user */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const creds = this.getCredentials()
    if (!creds) throw new Error('No NPM credentials configured')

    // Get current user info to find user ID
    const users = await this.apiRequest<NpmUser[]>('GET', '/users')
    const currentUser = users.find(u => u.email === creds.email)
    if (!currentUser) throw new Error('Current user not found in NPM')

    // Change password via NPM API
    await this.apiRequest('PUT', `/users/${currentUser.id}/auth`, {
      type: 'password',
      current: oldPassword,
      secret: newPassword,
    })

    // Update stored credentials with new password
    this.saveCredentials(creds.url, creds.email, newPassword)
  }

  /** List all proxy hosts from NPM */
  async listProxyHosts(): Promise<NpmProxyHost[]> {
    const raw = await this.apiRequest<Array<Record<string, unknown>>>('GET', '/proxy-hosts')
    return raw.map(host => ({
      id: host.id as number,
      domainNames: host.domain_names as string[],
      forwardHost: host.forward_host as string,
      forwardPort: host.forward_port as number,
      forwardScheme: host.forward_scheme as string,
      enabled: (host.enabled as number) === 1,
      sslForced: (host.ssl_forced as number) === 1,
      certificateId: (host.certificate_id as number) ?? 0,
      meta: (host.meta as Record<string, unknown>) ?? {},
    }))
  }

  /** Detect the NPM API URL from the proxy project's container ports */
  async detectNpmUrl(): Promise<string | null> {
    // Import here to avoid circular dependency
    const { projectService } = await import('./project')
    const proxyName = projectService.getProxyProject()
    if (!proxyName) return null

    const projects = await projectService.listProjects()
    const proxyProject = projects.find(p => p.name === proxyName)
    if (!proxyProject) return null

    // Find a container with port 81 mapped (NPM admin panel)
    for (const container of proxyProject.containers) {
      const adminPort = container.ports.find(p => p.private === 81 && p.public)
      if (adminPort) {
        return `http://localhost:${adminPort.public}`
      }
    }

    return null
  }

  private isUnauthorized(error: unknown): boolean {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      return (error as { statusCode: number }).statusCode === 401
    }
    return false
  }
}

// Persist across HMR reloads in development
const globalForNpm = globalThis as typeof globalThis & { __npmApiService?: NpmApiService }
export const npmApiService = globalForNpm.__npmApiService ??= new NpmApiService()
