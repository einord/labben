import type { ProjectGroup } from '~/types/project'

export function useGroups() {
  const groups = ref<ProjectGroup[]>([])
  const loading = ref(false)
  const toast = useToast()

  /** Fetch all groups from the API */
  async function fetchGroups() {
    loading.value = true
    try {
      const response = await $fetch<{ success: boolean; data: ProjectGroup[] }>('/api/groups')
      groups.value = response.data
    } catch {
      toast.error('Kunde inte hämta grupper')
    } finally {
      loading.value = false
    }
  }

  /** Create a new group */
  async function createGroup(name: string): Promise<boolean> {
    try {
      await $fetch('/api/groups', { method: 'POST', body: { name } })
      toast.success('Grupp skapad')
      await fetchGroups()
      return true
    } catch {
      toast.error('Kunde inte skapa grupp')
      return false
    }
  }

  /** Update a group */
  async function updateGroup(id: number, data: { name?: string; sortOrder?: number }) {
    try {
      await $fetch(`/api/groups/${id}`, { method: 'PUT', body: data })
      toast.success('Grupp uppdaterad')
      await fetchGroups()
    } catch {
      toast.error('Kunde inte uppdatera grupp')
    }
  }

  /** Delete a group */
  async function deleteGroup(id: number) {
    try {
      await $fetch(`/api/groups/${id}`, { method: 'DELETE' })
      toast.success('Grupp borttagen')
      await fetchGroups()
    } catch {
      toast.error('Kunde inte ta bort grupp')
    }
  }

  return { groups, loading, fetchGroups, createGroup, updateGroup, deleteGroup }
}
