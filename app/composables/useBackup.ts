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

  let pollInterval: ReturnType<typeof setInterval> | null = null

  async function runBackup(): Promise<boolean> {
    running.value = true
    try {
      await $fetch('/api/backup/run', { method: 'POST' })
      // Backup runs in background — poll history to track progress
      startPolling()
      return true
    } catch (err) {
      toast.error(t('backup.backupFailed'), err instanceof Error ? err.message : String(err))
      running.value = false
      return false
    }
  }

  function startPolling() {
    stopPolling()
    pollInterval = setInterval(async () => {
      await fetchHistory()
      const latest = history.value[0]
      if (latest && latest.status !== 'running') {
        stopPolling()
        running.value = false
        if (latest.status === 'success') {
          toast.success(t('backup.backupSuccess'))
        } else {
          toast.error(t('backup.backupFailed'), latest.errorMessage ?? '')
        }
      }
    }, 3000)
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
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
