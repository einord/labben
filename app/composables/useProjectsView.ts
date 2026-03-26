import type { ContainerSummary } from '~/types/docker'
import type { ProjectWithMetadata } from '~/types/project'

export function useProjectsView() {
  const route = useRoute()
  const router = useRouter()

  const {
    projects,
    loading: projectsLoading,
    fetchProjects,
    projectUp,
    projectDown,
    projectRestart,
    projectPull,
    createProject,
    assignGroup,
    removeFromDatabase,
  } = useProjects()

  const {
    containers: allContainers,
    loading: containersLoading,
    fetchContainers,
    startContainer,
    stopContainer,
    restartContainer,
  } = useContainers()

  const {
    groups,
    fetchGroups,
  } = useGroups()

  const {
    proxyHosts,
    fetchProxyHosts,
    baseDomain,
    fetchBaseDomain,
    status: npmStatus,
    fetchStatus: fetchNpmStatus,
  } = useNpm()

  // Selected project from query param
  const selectedProjectName = computed<string | undefined>(
    () => (route.query.selected as string) || undefined,
  )

  const selectedProject = computed<ProjectWithMetadata | undefined>(() => {
    if (!selectedProjectName.value) return undefined
    return projects.value.find(p => p.name === selectedProjectName.value)
  })

  const projectContainers = computed<ContainerSummary[]>(() => {
    if (!selectedProjectName.value) return []
    return allContainers.value.filter(c => c.project === selectedProjectName.value)
  })

  // Selected container for drawer
  const selectedContainerId = computed<string | null>(
    () => (route.query.container as string) || null,
  )

  const loading = computed(() => projectsLoading.value || containersLoading.value)

  /** Select a project by updating the URL query parameter */
  function selectProject(name: string) {
    router.push({ query: { selected: name } })
  }

  /** Open the container drawer by adding container ID to query */
  function selectContainer(id: string) {
    router.push({ query: { ...route.query, container: id } })
  }

  /** Close the container drawer by removing container from query */
  function closeContainerDrawer() {
    const { container: _, ...rest } = route.query
    router.push({ query: rest })
  }

  /** Refresh projects, containers, groups, and proxy hosts from the API */
  async function refreshAll() {
    await Promise.all([fetchProjects(), fetchContainers(), fetchGroups()])
    // Only fetch proxy hosts if NPM is connected (avoids error toasts)
    if (npmStatus.value.connected) {
      await fetchProxyHosts()
    }
  }

  /** Bring the selected project up and refresh */
  async function handleUp() {
    if (!selectedProjectName.value) return
    await projectUp(selectedProjectName.value)
    await refreshAll()
  }

  /** Bring the selected project down and refresh */
  async function handleDown() {
    if (!selectedProjectName.value) return
    await projectDown(selectedProjectName.value)
    await refreshAll()
  }

  /** Restart the selected project and refresh */
  async function handleRestart() {
    if (!selectedProjectName.value) return
    await projectRestart(selectedProjectName.value)
    await refreshAll()
  }

  /** Pull latest images for the selected project and refresh */
  async function handlePull() {
    if (!selectedProjectName.value) return
    await projectPull(selectedProjectName.value)
    await refreshAll()
  }

  /** Start a single container and refresh */
  async function handleStartContainer(id: string) {
    await startContainer(id)
    await refreshAll()
  }

  /** Stop a single container and refresh */
  async function handleStopContainer(id: string) {
    await stopContainer(id)
    await refreshAll()
  }

  /** Restart a single container and refresh */
  async function handleRestartContainer(id: string) {
    await restartContainer(id)
    await refreshAll()
  }

  /** Initialize by fetching all data including NPM status and base domain */
  async function init() {
    await Promise.all([
      Promise.all([fetchProjects(), fetchContainers(), fetchGroups()]),
      fetchNpmStatus(),
      fetchBaseDomain(),
    ])
    // Fetch proxy hosts after NPM status is known
    if (npmStatus.value.connected) {
      await fetchProxyHosts()
    }
  }

  /** Open proxy form for a container with smart defaults */
  function getProxySuggestion(containerId: string): { domain: string; host: string; port: number; project: string } | null {
    const container = projectContainers.value.find(c => c.id === containerId)
    if (!container) return null

    const publicPort = container.ports.find(p => p.public)
    if (!publicPort?.public) return null

    const name = container.name.replace(/^\//, '').replace(/[^a-z0-9-]/g, '-')
    const domain = baseDomain.value ? `${name}.${baseDomain.value}` : ''

    return {
      domain,
      host: 'host.docker.internal',
      port: publicPort.public,
      project: selectedProjectName.value ?? '',
    }
  }

  return {
    projects,
    groups,
    selectedProjectName,
    selectedProject,
    projectContainers,
    selectedContainerId,
    loading,
    projectsLoading,
    containersLoading,
    createProject,
    assignGroup,
    removeFromDatabase,
    fetchGroups,
    init,
    refreshAll,
    selectProject,
    selectContainer,
    closeContainerDrawer,
    handleUp,
    handleDown,
    handleRestart,
    handlePull,
    handleStartContainer,
    handleStopContainer,
    handleRestartContainer,
    proxyHosts,
    npmStatus,
    baseDomain,
    getProxySuggestion,
  }
}
