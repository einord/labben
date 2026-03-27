import type { BackupConfig, BackupHistoryEntry } from '~/types/backup'

export function useBackup() {
  const config = useState<BackupConfig | null>('backup-config', () => null)
  const history = ref<BackupHistoryEntry[]>([])
  const running = ref(false)
  const toast = useToast()
  const { t } = useI18n()

  async function fetchConfig() {
    try {
      const res = await $fetch<{ success: boolean; data: BackupConfig | null }>('/api/backup/config')
      config.value = res.data
    } catch {
      config.value = null
    }
  }

  async function saveConfig(newConfig: BackupConfig): Promise<boolean> {
    try {
      await $fetch('/api/backup/config', { method: 'PUT', body: newConfig })
      config.value = newConfig
      toast.success(t('backup.configSaved'))
      return true
    } catch (err) {
      toast.error(t('backup.configSaveError'), err instanceof Error ? err.message : String(err))
      return false
    }
  }

  async function runBackup(): Promise<boolean> {
    running.value = true
    try {
      await $fetch('/api/backup/run', { method: 'POST' })
      toast.success(t('backup.backupSuccess'))
      await fetchHistory()
      return true
    } catch (err) {
      toast.error(t('backup.backupFailed'), err instanceof Error ? err.message : String(err))
      await fetchHistory()
      return false
    } finally {
      running.value = false
    }
  }

  async function fetchHistory() {
    try {
      const res = await $fetch<{ success: boolean; data: BackupHistoryEntry[] }>('/api/backup/history')
      history.value = res.data
    } catch {
      history.value = []
    }
  }

  async function testDestination(path: string): Promise<boolean> {
    try {
      const res = await $fetch<{ success: boolean; data: { writable: boolean } }>('/api/backup/test', {
        method: 'POST',
        body: { path },
      })
      return res.data.writable
    } catch {
      return false
    }
  }

  return { config, history, running, fetchConfig, saveConfig, runBackup, fetchHistory, testDestination }
}
