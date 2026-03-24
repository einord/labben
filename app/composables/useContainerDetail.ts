import type { ContainerDetail } from '~/types/docker'

export function useContainerDetail(id: Ref<string> | string) {
  const container = ref<ContainerDetail | null>(null)
  const logs = ref<string>('')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  const resolvedId = computed(() => typeof id === 'string' ? id : id.value)

  /** Fetch detailed container information */
  async function fetchDetail() {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ success: boolean; data: ContainerDetail }>(`/api/containers/${resolvedId.value}`)
      container.value = response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch container details'
      toast.error('Kunde inte hämta containerdetaljer')
    } finally {
      loading.value = false
    }
  }

  /** Fetch container logs with an optional tail limit */
  async function fetchLogs(tail?: number) {
    try {
      const query = tail ? `?tail=${tail}` : ''
      const response = await $fetch<{ success: boolean; data: string }>(`/api/containers/${resolvedId.value}/logs${query}`)
      logs.value = response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch logs'
      toast.error('Kunde inte hämta loggar')
    }
  }

  return { container, logs, loading, error, fetchDetail, fetchLogs }
}
