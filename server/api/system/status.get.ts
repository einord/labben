import { access, stat } from 'node:fs/promises'
import { constants } from 'node:fs'

interface SystemStatus {
  composePath: { mounted: boolean }
  backupPath: { mounted: boolean; writable: boolean }
  dockerSocket: { available: boolean }
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
  const composeMounted = await isDirectoryMounted('/data/compose')
  const backupMounted = await isDirectoryMounted('/backups')
  const backupWritable = backupMounted ? await isWritable('/backups') : false
  const dockerAvailable = await isDirectoryMounted('/var/run/docker.sock')
    .catch(() => false)
    // Socket is a file, not a directory
    || await access('/var/run/docker.sock', constants.R_OK).then(() => true).catch(() => false)

  const rpId = process.env.AUTH_RP_ID || 'localhost'
  const origin = process.env.AUTH_ORIGIN || 'http://localhost:3005'
  const authConfigured = rpId !== 'localhost'

  return {
    success: true,
    data: {
      composePath: { mounted: composeMounted },
      backupPath: { mounted: backupMounted, writable: backupWritable },
      dockerSocket: { available: dockerAvailable },
      auth: { configured: authConfigured, rpId, origin },
    },
  }
})
