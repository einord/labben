import type { ContainerSummary } from '~/types/docker'

export function useContainers() {
  const containers = ref<ContainerSummary[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()
  const { t } = useI18n()

  /** Fetch all containers from the API */
  async function fetchContainers() {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ success: boolean; data: ContainerSummary[] }>('/api/containers')
      containers.value = response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch containers'
      toast.error(t('toast.containersFetchError'))
    } finally {
      loading.value = false
    }
  }

  /** Start a container by ID */
  async function startContainer(id: string) {
    try {
      await $fetch(`/api/containers/${id}/start`, { method: 'POST' })
      toast.success(t('toast.containerStarted'))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to start container'
      toast.error(t('toast.containerStartError'))
    }
  }

  /** Stop a container by ID */
  async function stopContainer(id: string) {
    try {
      await $fetch(`/api/containers/${id}/stop`, { method: 'POST' })
      toast.success(t('toast.containerStopped'))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to stop container'
      toast.error(t('toast.containerStopError'))
    }
  }

  /** Restart a container by ID */
  async function restartContainer(id: string) {
    try {
      await $fetch(`/api/containers/${id}/restart`, { method: 'POST' })
      toast.success(t('toast.containerRestarted'))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to restart container'
      toast.error(t('toast.containerRestartError'))
    }
  }

  return { containers, loading, error, fetchContainers, startContainer, stopContainer, restartContainer }
}
