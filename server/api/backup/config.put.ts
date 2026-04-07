import { resolve } from 'node:path'
import type { BackupConfig } from '~/types/backup'
import { databaseService } from '../../services/database'
import { backupService } from '../../services/backup'

const ALLOWED_BACKUP_BASE = '/backups'

export default defineEventHandler(async (event) => {
  const body = await readBody<Partial<BackupConfig>>(event)

  if (!body?.destination?.trim()) {
    throw createError({ statusCode: 400, message: 'Destination is required' })
  }

  const resolved = resolve(body.destination.trim())
  if (!resolved.startsWith(ALLOWED_BACKUP_BASE + '/') && resolved !== ALLOWED_BACKUP_BASE) {
    throw createError({ statusCode: 400, message: `Backup destination must be under ${ALLOWED_BACKUP_BASE}` })
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
    backupService.startScheduler()
  } else {
    backupService.stopScheduler()
  }

  return { success: true }
})
