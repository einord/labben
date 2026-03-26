import type { ProjectWithMetadata } from '~/types/project'

export function useProjects() {
  const projects = ref<ProjectWithMetadata[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()
  const { t } = useI18n()

  /** Fetch all compose projects */
  async function fetchProjects() {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ success: boolean; data: ProjectWithMetadata[] }>('/api/projects')
      projects.value = response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch projects'
      toast.error(t('toast.projectsFetchError'))
    } finally {
      loading.value = false
    }
  }

  /** Bring a project up */
  async function projectUp(name: string) {
    try {
      await $fetch(`/api/projects/${name}/up`, { method: 'POST' })
      toast.success(t('toast.projectStarted'))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to start project'
      toast.error(t('toast.projectStartError'))
    }
  }

  /** Bring a project down */
  async function projectDown(name: string) {
    try {
      await $fetch(`/api/projects/${name}/down`, { method: 'POST' })
      toast.success(t('toast.projectStopped'))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to stop project'
      toast.error(t('toast.projectStopError'))
    }
  }

  /** Pull latest images for a project */
  async function projectPull(name: string) {
    try {
      await $fetch(`/api/projects/${name}/pull`, { method: 'POST' })
      toast.success(t('toast.imagesUpdated'))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to pull project images'
      toast.error(t('toast.imagesPullError'))
    }
  }

  /** Restart a project (down + up) */
  async function projectRestart(name: string) {
    try {
      await $fetch(`/api/projects/${name}/down`, { method: 'POST' })
      await $fetch(`/api/projects/${name}/up`, { method: 'POST' })
      toast.success(t('toast.projectRestarted'))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to restart project'
      toast.error(t('toast.projectRestartError'))
    }
  }

  /** Update a project (pull + down + up) — pull first to minimize downtime */
  async function projectUpdate(name: string) {
    try {
      await $fetch(`/api/projects/${name}/pull`, { method: 'POST' })
      await $fetch(`/api/projects/${name}/down`, { method: 'POST' })
      await $fetch(`/api/projects/${name}/up`, { method: 'POST' })
      toast.success(t('toast.projectUpdated'))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update project'
      toast.error(t('toast.projectUpdateError'))
    }
  }

  /** Get the raw compose config for a project */
  async function getConfig(name: string): Promise<string> {
    try {
      const response = await $fetch<{ success: boolean; data: string }>(`/api/projects/${name}/config`)
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get config'
      toast.error(t('toast.configFetchError'))
      return ''
    }
  }

  /** Save the compose config for a project */
  async function saveConfig(name: string, content: string) {
    try {
      await $fetch(`/api/projects/${name}/config`, {
        method: 'PUT',
        body: { content },
      })
      toast.success(t('toast.configSaved'))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save config'
      toast.error(t('toast.configSaveError'))
    }
  }

  /** Create a new compose project */
  async function createProject(name: string, content: string): Promise<boolean> {
    try {
      await $fetch('/api/projects', {
        method: 'POST',
        body: { name, content },
      })
      toast.success(t('toast.projectCreated', { name }))
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project'
      error.value = message
      toast.error(t('toast.projectCreateError'))
      return false
    }
  }

  /** Assign a project to a group */
  async function assignGroup(projectName: string, groupId: number | null) {
    try {
      await $fetch(`/api/projects/${projectName}/metadata`, {
        method: 'PUT',
        body: { groupId },
      })
      toast.success(groupId ? t('toast.groupAssigned') : t('toast.groupUnassigned'))
    } catch {
      toast.error(t('toast.groupAssignError'))
    }
  }

  /** Remove a missing project from the database */
  async function removeFromDatabase(projectName: string) {
    try {
      await $fetch(`/api/projects/${projectName}/metadata`, {
        method: 'PUT',
        body: { groupId: null, displayName: null },
      })
      toast.success(t('toast.projectRemovedFromDb'))
    } catch {
      toast.error(t('toast.projectRemoveError'))
    }
  }

  return { projects, loading, error, fetchProjects, createProject, projectUp, projectDown, projectRestart, projectUpdate, projectPull, getConfig, saveConfig, assignGroup, removeFromDatabase }
}
