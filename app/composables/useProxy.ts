import type { ProjectWithMetadata, SystemSettings } from '~/types/project'

export function useProxy() {
  const proxyProject = useState<string | null>('proxy-project', () => null)
  const npmCandidates = ref<ProjectWithMetadata[]>([])
  const loading = ref(false)
  const toast = useToast()
  const { t } = useI18n()

  /** Fetch the current proxy settings */
  async function fetchProxySettings() {
    try {
      const response = await $fetch<{ success: boolean; data: SystemSettings }>('/api/settings/proxy')
      proxyProject.value = response.data.proxyProject
    } catch {
      proxyProject.value = null
    }
  }

  /** Fetch all projects that are NPM-compatible */
  async function fetchNpmCandidates() {
    loading.value = true
    try {
      const response = await $fetch<{ success: boolean; data: ProjectWithMetadata[] }>('/api/projects/npm-candidates')
      npmCandidates.value = response.data
    } catch {
      npmCandidates.value = []
    } finally {
      loading.value = false
    }
  }

  /** Set a project as the system proxy */
  async function setProxyProject(name: string) {
    try {
      await $fetch('/api/settings/proxy', { method: 'PUT', body: { projectName: name } })
      proxyProject.value = name
      toast.success(t('toast.proxyProjectSet'))
    } catch {
      toast.error(t('toast.proxyProjectSetError'))
    }
  }

  /** Create a new NPM project with default template and set as proxy */
  async function createNpmProject(name: string): Promise<boolean> {
    try {
      await $fetch('/api/projects/npm', { method: 'POST', body: { name } })
      proxyProject.value = name
      toast.success(t('toast.proxyProjectCreated', { name }))
      return true
    } catch {
      toast.error(t('toast.proxyProjectCreateError'))
      return false
    }
  }

  /** Clear the proxy designation */
  async function clearProxy() {
    try {
      await $fetch('/api/settings/proxy', { method: 'DELETE' })
      proxyProject.value = null
      toast.success(t('toast.proxyCleared'))
    } catch {
      toast.error(t('toast.proxyClearError'))
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
