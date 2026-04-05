interface SystemStatus {
  composePath: { mounted: boolean }
  backupPath: { mounted: boolean; writable: boolean }
  dockerSocket: { available: boolean }
  hostPathSymlink: { needed: boolean; ok: boolean; error: string | null }
  auth: { configured: boolean; rpId: string; origin: string }
}

export function useSystemStatus() {
  const status = useState<SystemStatus | null>('system-status', () => null)

  async function fetchStatus() {
    try {
      const res = await $fetch<{ success: boolean; data: SystemStatus }>('/api/system/status')
      status.value = res.data
    } catch {
      status.value = null
    }
  }

  return { status, fetchStatus }
}
