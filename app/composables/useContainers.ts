import type { ContainerSummary } from '~/types/docker'

export function useContainers() {
  const containers = ref<ContainerSummary[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  /** Fetch all containers from the API */
  async function fetchContainers() {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ success: boolean; data: ContainerSummary[] }>('/api/containers')
      containers.value = response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch containers'
      toast.error('Kunde inte hämta containers')
    } finally {
      loading.value = false
    }
  }

  /** Start a container by ID */
  async function startContainer(id: string) {
    try {
      await $fetch(`/api/containers/${id}/start`, { method: 'POST' })
      toast.success('Container startad')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to start container'
      toast.error('Kunde inte starta container')
    }
  }

  /** Stop a container by ID */
  async function stopContainer(id: string) {
    try {
      await $fetch(`/api/containers/${id}/stop`, { method: 'POST' })
      toast.success('Container stoppad')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to stop container'
      toast.error('Kunde inte stoppa container')
    }
  }

  /** Restart a container by ID */
  async function restartContainer(id: string) {
    try {
      await $fetch(`/api/containers/${id}/restart`, { method: 'POST' })
      toast.success('Container omstartad')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to restart container'
      toast.error('Kunde inte starta om container')
    }
  }

  return { containers, loading, error, fetchContainers, startContainer, stopContainer, restartContainer }
}
