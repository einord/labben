export interface BackupConfig {
  destination: string
  scheduleDays: number[]
  scheduleHour: number
  scheduleMinute: number
  retentionCount: number
  enabled: boolean
}

export interface BackupHistoryEntry {
  id: string
  status: 'running' | 'success' | 'failed'
  startedAt: string
  finishedAt: string | null
  sizeBytes: number | null
  errorMessage: string | null
}
