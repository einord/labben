import type { ComposeProject, ContainerSummary } from '~/types/docker'

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
  } = useProjects()

  const {
    containers: allContainers,
    loading: containersLoading,
    fetchContainers,
    startContainer,
    stopContainer,
    restartContainer,
  } = useContainers()

  // Selected project from query param
  const selectedProjectName = computed<string | undefined>(
    () => (route.query.selected as string) || undefined,
  )

  const selectedProject = computed<ComposeProject | undefined>(() => {
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

  /** Refresh both projects and containers from the API */
  async function refreshAll() {
    await Promise.all([fetchProjects(), fetchContainers()])
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

  /** Initialize by fetching all data */
  async function init() {
    await refreshAll()
  }

  return {
    projects,
    selectedProjectName,
    selectedProject,
    projectContainers,
    selectedContainerId,
    loading,
    projectsLoading,
    containersLoading,
    createProject,
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
  }
}
