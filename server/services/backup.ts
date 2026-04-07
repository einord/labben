import { randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve, join } from 'node:path'
import { mkdir, readdir, realpath, rm, stat } from 'node:fs/promises'
import { databaseService } from './database'
import type { BackupConfig } from '~/types/backup'

const execFileAsync = promisify(execFile)

const ALLOWED_BACKUP_BASE = '/backups'

class BackupService {
  private composeDir: string
  private dataDir: string
  private schedulerInterval: ReturnType<typeof setInterval> | null = null
  private lastCheckedMinute = -1
  private isRunning = false

  constructor() {
    this.composeDir = '/data/compose'
    this.dataDir = '/data/db'
  }

  /** Validate that a destination path resolves to within the allowed backup base directory */
  private async validateDestinationPath(destPath: string): Promise<string> {
    const resolved = resolve(destPath)

    // Check the resolved path is under the allowed base before creating directories
    if (!resolved.startsWith(ALLOWED_BACKUP_BASE + '/') && resolved !== ALLOWED_BACKUP_BASE) {
      throw new Error(`Backup destination must be under ${ALLOWED_BACKUP_BASE}`)
    }

    // If the path already exists, resolve symlinks and re-check
    try {
      const real = await realpath(resolved)
      if (!real.startsWith(ALLOWED_BACKUP_BASE + '/') && real !== ALLOWED_BACKUP_BASE) {
        throw new Error(`Backup destination must be under ${ALLOWED_BACKUP_BASE}`)
      }
      return real
    } catch (err) {
      // ENOENT is fine — the directory doesn't exist yet but the resolved path is valid
      if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
        return resolved
      }
      throw err
    }
  }

  /** Initialize scheduler from saved config */
  initScheduler(): void {
    const config = databaseService.getBackupConfig()
    if (config?.enabled) {
      this.startScheduler()
    }
  }

  /** Test if a destination path is writable */
  async testDestination(destPath: string): Promise<boolean> {
    try {
      const validated = await this.validateDestinationPath(destPath)
      await mkdir(validated, { recursive: true })
      const testFile = join(validated, '.labben-backup-test')
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
      const dest = await this.validateDestinationPath(config.destination)
      const latestDir = join(dest, 'latest')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '').replace('T', '_').slice(0, 15)
      const historyDir = join(dest, 'history', timestamp)

      await mkdir(join(latestDir, 'compose'), { recursive: true })
      await mkdir(join(dest, 'history'), { recursive: true })

      // 1. SQLite backup (atomic snapshot)
      const dbBackupPath = join(latestDir, 'labben.db')
      databaseService.backupDatabase(dbBackupPath)

      // 2. rsync compose directory (skip permissions for network filesystem compatibility)
      await execFileAsync('rsync', [
        '-rlt', '--delete', '--no-perms', '--no-owner', '--no-group',
        `${this.composeDir}/`,
        `${join(latestDir, 'compose')}/`,
      ], { timeout: 600_000 })

      // 3. Create compressed archive of the backup
      const archivePath = join(dest, 'history', `${timestamp}.tar.gz`)
      await execFileAsync('tar', ['-czf', archivePath, '-C', dest, 'latest'], { timeout: 600_000 })

      // 4. Calculate size of the archive
      const sizeBytes = await this.getFileSize(archivePath)

      // 5. Clean up old archives beyond retention count
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

  /** Start the scheduler (checks every 30 seconds if it's time to run) */
  startScheduler(): void {
    this.stopScheduler()
    this.schedulerInterval = setInterval(() => this.checkSchedule(), 30_000)
  }

  /** Stop the scheduler */
  stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval)
      this.schedulerInterval = null
    }
  }

  /** Check if it's time to run a backup based on config */
  private async checkSchedule(): Promise<void> {
    if (this.isRunning) return

    const config = databaseService.getBackupConfig()
    if (!config?.enabled) return

    const now = new Date()
    const currentDay = now.getDay()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    // Only trigger once per minute
    const minuteKey = currentDay * 10000 + currentHour * 100 + currentMinute
    if (minuteKey === this.lastCheckedMinute) return

    if (
      config.scheduleDays.includes(currentDay)
      && currentHour === config.scheduleHour
      && currentMinute === config.scheduleMinute
    ) {
      this.lastCheckedMinute = minuteKey
      try {
        await this.runBackup()
      } catch {
        // Error already logged in backup history
      }
    }
  }

  /** Get file size in bytes */
  private async getFileSize(filePath: string): Promise<number> {
    try {
      const fileStat = await stat(filePath)
      return fileStat.size
    } catch {
      return 0
    }
  }

  /** Remove old backup archives beyond retention count */
  private async cleanOldBackups(dest: string, retentionCount: number): Promise<void> {
    try {
      const historyDir = join(dest, 'history')
      const entries = await readdir(historyDir)
      const archives = entries.filter(e => e.endsWith('.tar.gz')).sort().reverse()
      for (const entry of archives.slice(retentionCount)) {
        await rm(join(historyDir, entry), { force: true })
      }
    } catch {
      // History dir may not exist yet
    }
  }
}

// Persist across HMR reloads in development
const globalForBackup = globalThis as typeof globalThis & { __backupService?: BackupService }
export const backupService = globalForBackup.__backupService ??= new BackupService()
