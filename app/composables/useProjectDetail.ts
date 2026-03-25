import type { ComposeProject, ContainerSummary } from '~/types/docker'

export function useProjectDetail(projectName: Ref<string>) {
  const {
    projects,
    loading: projectsLoading,
    fetchProjects,
    projectUp,
    projectDown,
    projectRestart,
    projectPull,
    getConfig,
    saveConfig,
  } = useProjects()

  const {
    containers: allContainers,
    loading: containersLoading,
    fetchContainers,
    startContainer,
    stopContainer,
    restartContainer,
  } = useContainers()

  const composeContent = ref('')

  const project = computed<ComposeProject | undefined>(() => {
    return projects.value.find(p => p.name === projectName.value)
  })

  const containers = computed<ContainerSummary[]>(() => {
    return allContainers.value.filter(c => c.project === projectName.value)
  })

  const loading = computed(() => projectsLoading.value || containersLoading.value)

  /** Refresh both projects and containers from the API */
  async function refreshAll() {
    await Promise.all([fetchProjects(), fetchContainers()])
  }

  /** Load the compose config for the current project */
  async function loadConfig() {
    composeContent.value = await getConfig(projectName.value)
  }

  /** Save the current compose content to the project */
  async function handleSaveConfig() {
    await saveConfig(projectName.value, composeContent.value)
  }

  /** Bring the project up and refresh */
  async function handleUp() {
    await projectUp(projectName.value)
    await refreshAll()
  }

  /** Bring the project down and refresh */
  async function handleDown() {
    await projectDown(projectName.value)
    await refreshAll()
  }

  /** Restart the project and refresh */
  async function handleRestart() {
    await projectRestart(projectName.value)
    await refreshAll()
  }

  /** Pull latest images and refresh */
  async function handlePull() {
    await projectPull(projectName.value)
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
    await Promise.all([fetchProjects(), fetchContainers(), loadConfig()])
  }

  return {
    project,
    containers,
    composeContent,
    loading,
    projectsLoading,
    containersLoading,
    init,
    refreshAll,
    loadConfig,
    handleSaveConfig,
    handleUp,
    handleDown,
    handleRestart,
    handlePull,
    handleStartContainer,
    handleStopContainer,
    handleRestartContainer,
  }
}
