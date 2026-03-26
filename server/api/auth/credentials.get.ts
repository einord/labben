import { authService } from '../../services/auth'
import { databaseService } from '../../services/database'

export default defineEventHandler(async (event) => {
  const userId = await authService.getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const credentials = databaseService.getCredentialsByUserId(userId)
  const data = credentials.map(c => ({
    id: c.id,
    deviceType: c.deviceType,
    backedUp: c.backedUp,
    createdAt: c.createdAt,
  }))

  return { success: true, data }
})
