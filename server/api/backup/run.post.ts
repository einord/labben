import { backupService } from '../../services/backup'

export default defineEventHandler(async () => {
  try {
    await backupService.runBackup()
    return { success: true }
  } catch (error) {
    throw createError({ statusCode: 500, message: extractErrorMessage(error, 'Backup failed') })
  }
})
