import type { ProjectWithMetadata } from '~/types/project'

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

/** Check if a fetch error is a 503 Docker unavailable response */
function isDockerUnavailable(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>
    if (e.statusCode === 503 || e.status === 503) return true
    if (e.response && typeof e.response === 'object') {
      const resp = e.response as Record<string, unknown>
      if (resp.status === 503) return true
    }
  }
  return false
}

export function useProjects() {
  const projects = ref<ProjectWithMetadata[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const dockerUnavailable = ref(false)
  const toast = useToast()
  const { t } = useI18n()

  /** Fetch all compose projects */
  async function fetchProjects() {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ success: boolean; data: ProjectWithMetadata[] }>('/api/projects')
      projects.value = response.data
      dockerUnavailable.value = false
    } catch (err) {
      if (isDockerUnavailable(err)) {
        dockerUnavailable.value = true
        // Don't show toast — the page will display a banner instead
      } else {
        dockerUnavailable.value = false
        error.value = err instanceof Error ? err.message : 'Failed to fetch projects'
        toast.error(t('toast.projectsFetchError'))
      }
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
      toast.error(t('toast.projectStartError'), extractErrorDetails(err))
    }
  }

  /** Bring a project down */
  async function projectDown(name: string) {
    try {
      await $fetch(`/api/projects/${name}/down`, { method: 'POST' })
      toast.success(t('toast.projectStopped'))
    } catch (err) {
      toast.error(t('toast.projectStopError'), extractErrorDetails(err))
    }
  }

  /** Pull latest images for a project */
  async function projectPull(name: string) {
    try {
      await $fetch(`/api/projects/${name}/pull`, { method: 'POST' })
      toast.success(t('toast.imagesUpdated'))
    } catch (err) {
      toast.error(t('toast.imagesPullError'), extractErrorDetails(err))
    }
  }

  /** Restart a project (down + up) */
  async function projectRestart(name: string) {
    try {
      await $fetch(`/api/projects/${name}/down`, { method: 'POST' })
      await $fetch(`/api/projects/${name}/up`, { method: 'POST' })
      toast.success(t('toast.projectRestarted'))
    } catch (err) {
      toast.error(t('toast.projectRestartError'), extractErrorDetails(err))
    }
  }

  /** Update a project (pull + down + up in one server-side operation) */
  async function projectUpdate(name: string) {
    try {
      await $fetch(`/api/projects/${name}/update`, { method: 'POST' })
      toast.success(t('toast.projectUpdated'))
    } catch (err) {
      toast.error(t('toast.projectUpdateError'), extractErrorDetails(err))
    }
  }

  /** Get the raw compose config for a project */
  async function getConfig(name: string): Promise<string> {
    try {
      const response = await $fetch<{ success: boolean; data: string }>(`/api/projects/${name}/config`)
      return response.data
    } catch (err) {
      toast.error(t('toast.configFetchError'), extractErrorDetails(err))
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
      toast.error(t('toast.configSaveError'), extractErrorDetails(err))
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
      toast.error(t('toast.projectCreateError'), extractErrorDetails(err))
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
    } catch (err) {
      toast.error(t('toast.groupAssignError'), extractErrorDetails(err))
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
    } catch (err) {
      toast.error(t('toast.projectRemoveError'), extractErrorDetails(err))
    }
  }

  return { projects, loading, error, dockerUnavailable, fetchProjects, createProject, projectUp, projectDown, projectRestart, projectUpdate, projectPull, getConfig, saveConfig, assignGroup, removeFromDatabase }
}
