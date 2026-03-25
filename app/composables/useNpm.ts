import type { NpmConnectionStatus, NpmProxyHost } from '~/types/npm'

export function useNpm() {
  const status = ref<NpmConnectionStatus>({ connected: false, url: null, email: null, isDefault: false })
  const proxyHosts = ref<NpmProxyHost[]>([])
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
    } catch {
      toast.error('Kunde inte ansluta med angivna uppgifter')
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
    } catch {
      toast.error('Kunde inte ta bort uppgifter')
    }
  }

  /** Change NPM password */
  async function changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      await $fetch('/api/npm/change-password', { method: 'POST', body: { oldPassword, newPassword } })
      toast.success('Lösenord ändrat')
      await fetchStatus()
      return true
    } catch {
      toast.error('Kunde inte ändra lösenord')
      return false
    }
  }

  /** Fetch proxy hosts */
  async function fetchProxyHosts() {
    loading.value = true
    try {
      const response = await $fetch<{ success: boolean; data: NpmProxyHost[] }>('/api/npm/proxy-hosts')
      proxyHosts.value = response.data
    } catch {
      toast.error('Kunde inte hämta proxy hosts')
    } finally {
      loading.value = false
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
    loading,
    fetchStatus,
    testConnection,
    saveCredentials,
    clearCredentials,
    changePassword,
    fetchProxyHosts,
    detectUrl,
  }
}
