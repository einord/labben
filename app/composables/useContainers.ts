import type { ContainerSummary } from '~/types/docker'

export function useContainers() {
  const containers = ref<ContainerSummary[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** Fetch all containers from the API */
  async function fetchContainers() {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ success: boolean; data: ContainerSummary[] }>('/api/containers')
      containers.value = response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch containers'
    } finally {
      loading.value = false
    }
  }

  /** Start a container by ID */
  async function startContainer(id: string) {
    try {
      await $fetch(`/api/containers/${id}/start`, { method: 'POST' })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to start container'
    }
  }

  /** Stop a container by ID */
  async function stopContainer(id: string) {
    try {
      await $fetch(`/api/containers/${id}/stop`, { method: 'POST' })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to stop container'
    }
  }

  /** Restart a container by ID */
  async function restartContainer(id: string) {
    try {
      await $fetch(`/api/containers/${id}/restart`, { method: 'POST' })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to restart container'
    }
  }

  return { containers, loading, error, fetchContainers, startContainer, stopContainer, restartContainer }
}
