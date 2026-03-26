import type { ProjectGroup } from '~/types/project'

export function useGroups() {
  const groups = ref<ProjectGroup[]>([])
  const loading = ref(false)
  const toast = useToast()
  const { t } = useI18n()

  /** Fetch all groups from the API */
  async function fetchGroups() {
    loading.value = true
    try {
      const response = await $fetch<{ success: boolean; data: ProjectGroup[] }>('/api/groups')
      groups.value = response.data
    } catch {
      toast.error(t('toast.groupsFetchError'))
    } finally {
      loading.value = false
    }
  }

  /** Create a new group */
  async function createGroup(name: string): Promise<boolean> {
    try {
      await $fetch('/api/groups', { method: 'POST', body: { name } })
      toast.success(t('toast.groupCreated'))
      await fetchGroups()
      return true
    } catch {
      toast.error(t('toast.groupCreateError'))
      return false
    }
  }

  /** Update a group */
  async function updateGroup(id: number, data: { name?: string; sortOrder?: number }) {
    try {
      await $fetch(`/api/groups/${id}`, { method: 'PUT', body: data })
      toast.success(t('toast.groupUpdated'))
      await fetchGroups()
    } catch {
      toast.error(t('toast.groupUpdateError'))
    }
  }

  /** Delete a group */
  async function deleteGroup(id: number) {
    try {
      await $fetch(`/api/groups/${id}`, { method: 'DELETE' })
      toast.success(t('toast.groupDeleted'))
      await fetchGroups()
    } catch {
      toast.error(t('toast.groupDeleteError'))
    }
  }

  return { groups, loading, fetchGroups, createGroup, updateGroup, deleteGroup }
}
