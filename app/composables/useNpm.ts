import type { NpmConnectionStatus, NpmProxyHost, CreateProxyHostData } from '~/types/npm'

/** Extract a human-readable error message from a fetch error */
function extractErrorDetails(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>
    if (e.data && typeof e.data === 'object') {
      const data = e.data as Record<string, unknown>
      if (typeof data.message === 'string') return data.message
      if (typeof data.statusMessage === 'string') return data.statusMessage
    }
    if (typeof e.message === 'string') return e.message
    if (typeof e.statusMessage === 'string') return e.statusMessage
  }
  return String(err)
}

export function useNpm() {
  const status = ref<NpmConnectionStatus>({ connected: false, url: null, email: null, isDefault: false })
  const proxyHosts = ref<NpmProxyHost[]>([])
  const baseDomain = ref<string | null>(null)
  const loading = ref(false)
  const toast = useToast()

  /** Fetch NPM connection status */
  async function fetchStatus() {
    try {
      const response = await $fetch<{ success: boolean; data: NpmConnectionStatus }>('/api/npm/status')
      status.value = response.data
    } catch {
      status.value = { connected: false, url: null, email: null, isDefault: false }
    }
  }

  /** Test connection without saving */
  async function testConnection(url: string, email: string, password: string): Promise<boolean> {
    try {
      const response = await $fetch<{ success: boolean; data: { connected: boolean } }>('/api/npm/test', {
        method: 'POST',
        body: { url, email, password },
      })
      return response.data.connected
    } catch {
      return false
    }
  }

  /** Save credentials (tests connection first on server side) */
  async function saveCredentials(url: string, email: string, password: string): Promise<boolean> {
    try {
      await $fetch('/api/npm/credentials', { method: 'PUT', body: { url, email, password } })
      toast.success('Inloggningsuppgifter sparade')
      await fetchStatus()
      return true
    } catch (err) {
      toast.error('Kunde inte ansluta med angivna uppgifter', extractErrorDetails(err))
      return false
    }
  }

  /** Clear stored credentials */
  async function clearCredentials() {
    try {
      await $fetch('/api/npm/credentials', { method: 'DELETE' })
      status.value = { connected: false, url: null, email: null, isDefault: false }
      proxyHosts.value = []
      toast.success('Uppgifter borttagna')
    } catch (err) {
      toast.error('Kunde inte ta bort uppgifter', extractErrorDetails(err))
    }
  }

  /** Change NPM password */
  async function changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      await $fetch('/api/npm/change-password', { method: 'POST', body: { oldPassword, newPassword } })
      toast.success('Lösenord ändrat')
      await fetchStatus()
      return true
    } catch (err) {
      toast.error('Kunde inte ändra lösenord', extractErrorDetails(err))
      return false
    }
  }

  /** Fetch proxy hosts */
  async function fetchProxyHosts() {
    loading.value = true
    try {
      const response = await $fetch<{ success: boolean; data: NpmProxyHost[] }>('/api/npm/proxy-hosts')
      proxyHosts.value = response.data
    } catch (err) {
      toast.error('Kunde inte hämta proxy hosts', extractErrorDetails(err))
    } finally {
      loading.value = false
    }
  }

  /** Create a new proxy host */
  async function createProxyHost(data: CreateProxyHostData): Promise<boolean> {
    try {
      await $fetch('/api/npm/proxy-hosts', { method: 'POST', body: data })
      toast.success('Proxy host skapad')
      await fetchProxyHosts()
      return true
    } catch (err) {
      toast.error('Kunde inte skapa proxy host', extractErrorDetails(err))
      return false
    }
  }

  /** Update an existing proxy host */
  async function updateProxyHost(id: number, data: CreateProxyHostData): Promise<boolean> {
    try {
      await $fetch(`/api/npm/proxy-hosts/${id}`, { method: 'PUT', body: data })
      toast.success('Proxy host uppdaterad')
      await fetchProxyHosts()
      return true
    } catch (err) {
      toast.error('Kunde inte uppdatera proxy host', extractErrorDetails(err))
      return false
    }
  }

  /** Delete a proxy host */
  async function deleteProxyHost(id: number): Promise<boolean> {
    try {
      await $fetch(`/api/npm/proxy-hosts/${id}`, { method: 'DELETE' })
      toast.success('Proxy host borttagen')
      await fetchProxyHosts()
      return true
    } catch (err) {
      toast.error('Kunde inte ta bort proxy host', extractErrorDetails(err))
      return false
    }
  }

  /** Fetch the base domain setting */
  async function fetchBaseDomain() {
    try {
      const response = await $fetch<{ success: boolean; data: { baseDomain: string | null } }>('/api/settings/base-domain')
      baseDomain.value = response.data.baseDomain
    } catch {
      baseDomain.value = null
    }
  }

  /** Set the base domain */
  async function setBaseDomain(domain: string): Promise<boolean> {
    try {
      await $fetch('/api/settings/base-domain', { method: 'PUT', body: { baseDomain: domain } })
      baseDomain.value = domain
      toast.success('Basdomän sparad')
      return true
    } catch (err) {
      toast.error('Kunde inte spara basdomän', extractErrorDetails(err))
      return false
    }
  }

  /** Detect NPM API URL from proxy project containers */
  async function detectUrl(): Promise<string | null> {
    try {
      const response = await $fetch<{ success: boolean; data: { url: string | null } }>('/api/npm/detect-url')
      return response.data.url
    } catch {
      return null
    }
  }

  return {
    status,
    proxyHosts,
    baseDomain,
    loading,
    fetchStatus,
    testConnection,
    saveCredentials,
    clearCredentials,
    changePassword,
    fetchProxyHosts,
    createProxyHost,
    updateProxyHost,
    deleteProxyHost,
    fetchBaseDomain,
    setBaseDomain,
    detectUrl,
  }
}
