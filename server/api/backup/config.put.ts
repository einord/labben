import type { BackupConfig } from '~/types/backup'
import { databaseService } from '../../services/database'
import { backupService } from '../../services/backup'

export default defineEventHandler(async (event) => {
  const body = await readBody<Partial<BackupConfig>>(event)

  if (!body?.destination?.trim()) {
    throw createError({ statusCode: 400, message: 'Destination is required' })
  }

  const config: BackupConfig = {
    destination: body.destination.trim(),
    scheduleDays: body.scheduleDays ?? [0, 1, 2, 3, 4, 5, 6],
    scheduleHour: body.scheduleHour ?? 3,
    scheduleMinute: body.scheduleMinute ?? 0,
    retentionCount: body.retentionCount ?? 30,
    enabled: body.enabled ?? true,
  }

  databaseService.saveBackupConfig(config)

  // Restart scheduler with new config
  if (config.enabled) {
    backupService.startScheduler(config)
  } else {
    backupService.stopScheduler()
  }

  return { success: true }
})
