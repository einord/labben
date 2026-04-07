import { resolve } from 'node:path'
import { backupService } from '../../services/backup'

const ALLOWED_BACKUP_BASE = '/backups'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ path?: string }>(event)
  const path = body?.path?.trim()

  if (!path) {
    throw createError({ statusCode: 400, message: 'Path is required' })
  }

  const resolved = resolve(path)
  if (!resolved.startsWith(ALLOWED_BACKUP_BASE + '/') && resolved !== ALLOWED_BACKUP_BASE) {
    throw createError({ statusCode: 400, message: `Backup destination must be under ${ALLOWED_BACKUP_BASE}` })
  }

  const writable = await backupService.testDestination(path)
  return { success: true, data: { writable } }
})
