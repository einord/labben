import { backupService } from '../../services/backup'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ path?: string }>(event)
  const path = body?.path?.trim()

  if (!path) {
    throw createError({ statusCode: 400, message: 'Path is required' })
  }

  const writable = await backupService.testDestination(path)
  return { success: true, data: { writable } }
})
