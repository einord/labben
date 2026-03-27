import { randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve, join } from 'node:path'
import { mkdir, readdir, rm } from 'node:fs/promises'
import cron, { type ScheduledTask } from 'node-cron'
import { databaseService } from './database'
import type { BackupConfig } from '~/types/backup'

const execFileAsync = promisify(execFile)

class BackupService {
  private composeDir: string
  private dataDir: string
  private cronTask: ScheduledTask | null = null
  private isRunning = false

  constructor() {
    this.composeDir = resolve(process.env.COMPOSE_DIR || '/data/compose')
    this.dataDir = resolve(process.env.DATA_DIR || '/data')

    // Auto-start scheduler if config exists
    this.initScheduler()
  }

  /** Initialize scheduler from saved config */
  private initScheduler(): void {
    const config = databaseService.getBackupConfig()
    if (config?.enabled) {
      this.startScheduler(config)
    }
  }

  /** Test if a destination path is writable */
  async testDestination(destPath: string): Promise<boolean> {
    try {
      const resolved = resolve(destPath)
      await mkdir(resolved, { recursive: true })
      // Try writing a test file
      const testFile = join(resolved, '.labben-backup-test')
      await execFileAsync('touch', [testFile])
      await rm(testFile)
      return true
    } catch {
      return false
    }
  }

  /** Run a backup now */
  async runBackup(): Promise<void> {
    if (this.isRunning) throw new Error('Backup already running')

    const config = databaseService.getBackupConfig()
    if (!config) throw new Error('No backup configuration')

    const backupId = randomUUID()
    const startedAt = new Date().toISOString()

    this.isRunning = true
    databaseService.addBackupHistory(backupId, 'running', startedAt)

    try {
      const dest = resolve(config.destination)
      const latestDir = join(dest, 'latest')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '').replace('T', '_').slice(0, 15)
      const historyDir = join(dest, 'history', timestamp)

      // Ensure directories exist
      await mkdir(join(latestDir, 'compose'), { recursive: true })
      await mkdir(join(dest, 'history'), { recursive: true })

      // 1. SQLite backup (atomic snapshot)
      const dbPath = join(this.dataDir, 'labben.db')
      const dbBackupPath = join(latestDir, 'labben.db')
      databaseService.backupDatabase(dbBackupPath)

      // 2. rsync compose directory
      await execFileAsync('rsync', [
        '-a', '--delete',
        `${this.composeDir}/`,
        `${join(latestDir, 'compose')}/`,
      ], { timeout: 600_000 })

      // 3. Create timestamped hardlink copy
      await execFileAsync('cp', ['-al', latestDir, historyDir])

      // 4. Calculate size
      const sizeBytes = await this.getDirSize(latestDir)

      // 5. Clean up old history entries
      await this.cleanOldBackups(dest, config.retentionCount)
      databaseService.deleteOldBackupHistory(config.retentionCount)

      const finishedAt = new Date().toISOString()
      databaseService.updateBackupHistory(backupId, 'success', finishedAt, sizeBytes, null)
    } catch (err) {
      const finishedAt = new Date().toISOString()
      const message = err instanceof Error ? err.message : String(err)
      databaseService.updateBackupHistory(backupId, 'failed', finishedAt, null, message)
      throw err
    } finally {
      this.isRunning = false
    }
  }

  /** Start the cron scheduler */
  startScheduler(config: BackupConfig): void {
    this.stopScheduler()
    if (!config.enabled || config.scheduleDays.length === 0) return

    const days = config.scheduleDays.join(',')
    const cronExpr = `${config.scheduleMinute} ${config.scheduleHour} * * ${days}`

    this.cronTask = cron.schedule(cronExpr, async () => {
      try {
        await this.runBackup()
      } catch {
        // Error already logged in backup history
      }
    })
  }

  /** Stop the cron scheduler */
  stopScheduler(): void {
    if (this.cronTask) {
      this.cronTask.stop()
      this.cronTask = null
    }
  }

  /** Get approximate directory size in bytes */
  private async getDirSize(dirPath: string): Promise<number> {
    try {
      const { stdout } = await execFileAsync('du', ['-sb', dirPath])
      return parseInt(stdout.split('\t')[0] ?? '0', 10)
    } catch {
      return 0
    }
  }

  /** Remove old backup history directories beyond retention count */
  private async cleanOldBackups(dest: string, retentionCount: number): Promise<void> {
    try {
      const historyDir = join(dest, 'history')
      const entries = await readdir(historyDir)
      const sorted = entries.sort().reverse()
      for (const entry of sorted.slice(retentionCount)) {
        await rm(join(historyDir, entry), { recursive: true, force: true })
      }
    } catch {
      // History dir may not exist yet
    }
  }
}

// Persist across HMR reloads in development
const globalForBackup = globalThis as typeof globalThis & { __backupService?: BackupService }
export const backupService = globalForBackup.__backupService ??= new BackupService()
