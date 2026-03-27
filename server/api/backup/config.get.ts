import { databaseService } from '../../services/database'

export default defineEventHandler(() => {
  const config = databaseService.getBackupConfig()
  return { success: true, data: config }
})
