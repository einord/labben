import { backupService } from '../../services/backup'

export default defineEventHandler(() => {
  // Run backup in the background — don't await
  // Client polls /api/backup/history to track progress
  backupService.runBackup().catch(() => {
    // Error already logged in backup history
  })
  return { success: true }
})
