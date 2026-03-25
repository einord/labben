import type { ProjectWithMetadata, SystemSettings } from '~/types/project'

export function useProxy() {
  const proxyProject = ref<string | null>(null)
  const npmCandidates = ref<ProjectWithMetadata[]>([])
  const loading = ref(false)
  const toast = useToast()

  /** Fetch the current proxy settings */
  async function fetchProxySettings() {
    try {
      const response = await $fetch<{ success: boolean; data: SystemSettings }>('/api/settings/proxy')
      proxyProject.value = response.data.proxyProject
    } catch {
      toast.error('Kunde inte hamta proxy-installningar')
    }
  }

  /** Fetch all projects that are NPM-compatible */
  async function fetchNpmCandidates() {
    loading.value = true
    try {
      const response = await $fetch<{ success: boolean; data: ProjectWithMetadata[] }>('/api/projects/npm-candidates')
      npmCandidates.value = response.data
    } catch {
      toast.error('Kunde inte hamta proxy-kandidater')
    } finally {
      loading.value = false
    }
  }

  /** Set a project as the system proxy */
  async function setProxyProject(name: string) {
    try {
      await $fetch('/api/settings/proxy', { method: 'PUT', body: { projectName: name } })
      proxyProject.value = name
      toast.success('Proxy-projekt valt')
    } catch {
      toast.error('Kunde inte satta proxy-projekt')
    }
  }

  /** Create a new NPM project with default template and set as proxy */
  async function createNpmProject(name: string): Promise<boolean> {
    try {
      await $fetch('/api/projects/npm', { method: 'POST', body: { name } })
      proxyProject.value = name
      toast.success(`Proxy-projekt '${name}' skapat`)
      return true
    } catch {
      toast.error('Kunde inte skapa proxy-projekt')
      return false
    }
  }

  /** Clear the proxy designation */
  async function clearProxy() {
    try {
      await $fetch('/api/settings/proxy', { method: 'DELETE' })
      proxyProject.value = null
      toast.success('Proxy-installning borttagen')
    } catch {
      toast.error('Kunde inte ta bort proxy-installning')
    }
  }

  return {
    proxyProject,
    npmCandidates,
    loading,
    fetchProxySettings,
    fetchNpmCandidates,
    setProxyProject,
    createNpmProject,
    clearProxy,
  }
}
