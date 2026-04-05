import { access, stat } from 'node:fs/promises'
import { constants } from 'node:fs'
import { resolve } from 'node:path'
import { dockerService } from '../../services/docker'
import { composePath as configuredComposePath } from '../../utils/config'

interface SystemStatus {
  composePath: { mounted: boolean }
  backupPath: { mounted: boolean; writable: boolean }
  dockerSocket: { available: boolean }
  hostPathSymlink: { needed: boolean; ok: boolean; error: string | null }
  auth: { configured: boolean; rpId: string; origin: string }
}

async function isDirectoryMounted(path: string): Promise<boolean> {
  try {
    const s = await stat(path)
    if (!s.isDirectory()) return false
    // A mounted directory typically has content or is writable
    await access(path, constants.R_OK)
    return true
  } catch {
    return false
  }
}

async function isWritable(path: string): Promise<boolean> {
  try {
    await access(path, constants.W_OK)
    return true
  } catch {
    return false
  }
}

export default defineEventHandler(async (): Promise<{ success: boolean; data: SystemStatus }> => {
  const composePath = configuredComposePath
  const backupPath = resolve(process.env.BACKUP_PATH || '/backups')

  const composeMounted = await isDirectoryMounted(composePath)
  const backupMounted = await isDirectoryMounted(backupPath)
  const backupWritable = backupMounted ? await isWritable(backupPath) : false
  const dockerAvailable = await isDirectoryMounted('/var/run/docker.sock')
    .catch(() => false)
    // Socket is a file, not a directory
    || await access('/var/run/docker.sock', constants.R_OK).then(() => true).catch(() => false)

  const rpId = process.env.AUTH_RP_ID || 'localhost'
  const origin = process.env.AUTH_ORIGIN || 'http://localhost:3005'
  const authConfigured = rpId !== 'localhost'

  const symlinkHealth = await dockerService.checkSymlinkHealth()

  return {
    success: true,
    data: {
      composePath: { mounted: composeMounted },
      backupPath: { mounted: backupMounted, writable: backupWritable },
      dockerSocket: { available: dockerAvailable },
      hostPathSymlink: symlinkHealth,
      auth: { configured: authConfigured, rpId, origin },
    },
  }
})
