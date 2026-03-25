import type { ProjectWithMetadata } from '~/types/project'

export function useProjects() {
  const projects = ref<ProjectWithMetadata[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  /** Fetch all compose projects */
  async function fetchProjects() {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ success: boolean; data: ProjectWithMetadata[] }>('/api/projects')
      projects.value = response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch projects'
      toast.error('Kunde inte hämta projekt')
    } finally {
      loading.value = false
    }
  }

  /** Bring a project up */
  async function projectUp(name: string) {
    try {
      await $fetch(`/api/projects/${name}/up`, { method: 'POST' })
      toast.success('Projekt startat')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to start project'
      toast.error('Kunde inte starta projekt')
    }
  }

  /** Bring a project down */
  async function projectDown(name: string) {
    try {
      await $fetch(`/api/projects/${name}/down`, { method: 'POST' })
      toast.success('Projekt stoppat')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to stop project'
      toast.error('Kunde inte stoppa projekt')
    }
  }

  /** Pull latest images for a project */
  async function projectPull(name: string) {
    try {
      await $fetch(`/api/projects/${name}/pull`, { method: 'POST' })
      toast.success('Images uppdaterade')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to pull project images'
      toast.error('Kunde inte hämta images')
    }
  }

  /** Restart a project (down + up) */
  async function projectRestart(name: string) {
    try {
      await $fetch(`/api/projects/${name}/down`, { method: 'POST' })
      await $fetch(`/api/projects/${name}/up`, { method: 'POST' })
      toast.success('Projekt omstartat')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to restart project'
      toast.error('Kunde inte starta om projekt')
    }
  }

  /** Get the raw compose config for a project */
  async function getConfig(name: string): Promise<string> {
    try {
      const response = await $fetch<{ success: boolean; data: string }>(`/api/projects/${name}/config`)
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get config'
      toast.error('Kunde inte hämta konfiguration')
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
      toast.success('Konfiguration sparad')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save config'
      toast.error('Kunde inte spara konfiguration')
    }
  }

  /** Create a new compose project */
  async function createProject(name: string, content: string): Promise<boolean> {
    try {
      await $fetch('/api/projects', {
        method: 'POST',
        body: { name, content },
      })
      toast.success(`Projekt '${name}' skapat`)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project'
      error.value = message
      toast.error('Kunde inte skapa projekt')
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
      toast.success(groupId ? 'Projekt tilldelat grupp' : 'Projekt borttaget från grupp')
    } catch {
      toast.error('Kunde inte uppdatera grupp')
    }
  }

  /** Remove a missing project from the database */
  async function removeFromDatabase(projectName: string) {
    try {
      await $fetch(`/api/projects/${projectName}/metadata`, {
        method: 'PUT',
        body: { groupId: null, displayName: null },
      })
      toast.success('Projekt borttaget från databasen')
    } catch {
      toast.error('Kunde inte ta bort projekt')
    }
  }

  return { projects, loading, error, fetchProjects, createProject, projectUp, projectDown, projectRestart, projectPull, getConfig, saveConfig, assignGroup, removeFromDatabase }
}
