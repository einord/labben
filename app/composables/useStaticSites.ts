import type { StaticSite, UpdateStaticSiteData, StaticSitesStatus } from '~/types/static-sites'

export function useStaticSites() {
  const sites = useState<StaticSite[]>('static-sites', () => [])
  const status = useState<StaticSitesStatus>('static-sites-status', () => ({
    containerRunning: false,
    siteCount: 0,
    managedContainerExists: false,
  }))
  const loading = ref(false)
  const toast = useToast()
  const { t } = useI18n()

  /** Fetch all static sites */
  async function fetchSites() {
    loading.value = true
    try {
      const res = await $fetch<{ success: boolean; data: StaticSite[] }>('/api/static-sites')
      sites.value = res.data
    } catch (err) {
      sites.value = []
      toast.warning(t('toast.staticSitesFetchError'), extractErrorDetails(err))
    } finally {
      loading.value = false
    }
  }

  /** Fetch container and site status */
  async function fetchStatus() {
    try {
      const res = await $fetch<{ success: boolean; data: StaticSitesStatus }>('/api/static-sites/status')
      status.value = res.data
    } catch (err) {
      status.value = { containerRunning: false, siteCount: 0, managedContainerExists: false }
      toast.warning(t('toast.staticSitesStatusFetchError'), extractErrorDetails(err))
    }
  }

  /** Create a new static site */
  async function createSite(domain: string): Promise<boolean> {
    try {
      await $fetch('/api/static-sites', { method: 'POST', body: { domain } })
      toast.success(t('staticSites.siteCreated', { domain }))
      await fetchSites()
      return true
    } catch (err) {
      toast.error(t('staticSites.createError'), extractErrorDetails(err))
      return false
    }
  }

  /** Update an existing static site */
  async function updateSite(id: number, data: UpdateStaticSiteData): Promise<boolean> {
    try {
      await $fetch(`/api/static-sites/${id}`, { method: 'PUT', body: data })
      toast.success(t('staticSites.siteUpdated', { domain: data.domain ?? '' }))
      await fetchSites()
      return true
    } catch (err) {
      toast.error(t('staticSites.updateError'), extractErrorDetails(err))
      return false
    }
  }

  /** Delete a static site */
  async function deleteSite(id: number): Promise<boolean> {
    try {
      await $fetch(`/api/static-sites/${id}`, { method: 'DELETE' })
      toast.success(t('staticSites.siteDeleted'))
      await fetchSites()
      return true
    } catch (err) {
      toast.error(t('staticSites.deleteError'), extractErrorDetails(err))
      return false
    }
  }

  /** Upload an archive file to a static site */
  async function uploadArchive(id: number, file: File): Promise<boolean> {
    const formData = new FormData()
    formData.append('file', file)
    try {
      await $fetch(`/api/static-sites/${id}/upload`, { method: 'POST', body: formData })
      toast.success(t('staticSites.uploadSuccess'))
      return true
    } catch (err) {
      toast.error(t('staticSites.uploadError'), extractErrorDetails(err))
      return false
    }
  }

  /** Get the file path for a static site */
  async function getSitePath(id: number): Promise<string | null> {
    try {
      const res = await $fetch<{ success: boolean; data: { path: string } }>(`/api/static-sites/${id}/path`)
      return res.data.path
    } catch {
      return null
    }
  }

  /** Start the static sites container */
  async function startContainer(): Promise<boolean> {
    try {
      await $fetch('/api/static-sites/container/start', { method: 'POST' })
      toast.success(t('staticSites.containerStarted'))
      await fetchStatus()
      return true
    } catch (err) {
      toast.error(t('staticSites.containerStartError'), extractErrorDetails(err))
      return false
    }
  }

  /** Stop the static sites container */
  async function stopContainer(): Promise<boolean> {
    try {
      await $fetch('/api/static-sites/container/stop', { method: 'POST' })
      toast.success(t('staticSites.containerStopped'))
      await fetchStatus()
      return true
    } catch (err) {
      toast.error(t('staticSites.containerStopError'), extractErrorDetails(err))
      return false
    }
  }

  return {
    sites,
    status,
    loading,
    fetchSites,
    fetchStatus,
    createSite,
    updateSite,
    deleteSite,
    uploadArchive,
    getSitePath,
    startContainer,
    stopContainer,
  }
}
