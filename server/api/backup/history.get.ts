import { databaseService } from '../../services/database'

export default defineEventHandler(() => {
  const history = databaseService.getBackupHistory()
  return { success: true, data: history }
})
