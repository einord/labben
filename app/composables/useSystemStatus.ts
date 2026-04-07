interface SystemStatus {
  composePath: { mounted: boolean }
  backupPath: { mounted: boolean; writable: boolean }
  dockerSocket: { available: boolean }
  hostPathSymlink: { needed: boolean; ok: boolean; error: string | null }
  database: { writable: boolean; mounted: boolean }
  composeHostDir: { configured: boolean; accessible: boolean }
  auth: { configured: boolean; rpId: string; origin: string }
}

export function useSystemStatus() {
  const status = useState<SystemStatus | null>('system-status', () => null)
  const toast = useToast()
  const { t } = useI18n()

  async function fetchStatus() {
    try {
      const res = await $fetch<{ success: boolean; data: SystemStatus }>('/api/system/status')
      status.value = res.data
    } catch (err) {
      status.value = null
      toast.warning(t('toast.systemStatusFetchError'), extractErrorDetails(err))
    }
  }

  return { status, fetchStatus }
}
