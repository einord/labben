import { backupService } from '../services/backup'

export default defineNitroPlugin(() => {
  // Initialize backup scheduler at server startup so scheduled backups
  // run even if no one has visited the UI or triggered an API call.
  backupService.initScheduler()
})
