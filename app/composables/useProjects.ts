import type { ComposeProject } from '~/types/docker'

export function useProjects() {
  const projects = ref<ComposeProject[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** Fetch all compose projects */
  async function fetchProjects() {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ success: boolean; data: ComposeProject[] }>('/api/projects')
      projects.value = response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch projects'
    } finally {
      loading.value = false
    }
  }

  /** Bring a project up */
  async function projectUp(name: string) {
    try {
      await $fetch(`/api/projects/${name}/up`, { method: 'POST' })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to start project'
    }
  }

  /** Bring a project down */
  async function projectDown(name: string) {
    try {
      await $fetch(`/api/projects/${name}/down`, { method: 'POST' })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to stop project'
    }
  }

  /** Pull latest images for a project */
  async function projectPull(name: string) {
    try {
      await $fetch(`/api/projects/${name}/pull`, { method: 'POST' })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to pull project images'
    }
  }

  /** Restart a project (down + up) */
  async function projectRestart(name: string) {
    try {
      await $fetch(`/api/projects/${name}/down`, { method: 'POST' })
      await $fetch(`/api/projects/${name}/up`, { method: 'POST' })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to restart project'
    }
  }

  /** Get the raw compose config for a project */
  async function getConfig(name: string): Promise<string> {
    try {
      const response = await $fetch<{ success: boolean; data: string }>(`/api/projects/${name}/config`)
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get config'
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
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save config'
    }
  }

  return { projects, loading, error, fetchProjects, projectUp, projectDown, projectRestart, projectPull, getConfig, saveConfig }
}
