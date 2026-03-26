import { authService } from '../../services/auth'
import { databaseService } from '../../services/database'

export default defineEventHandler(async (event) => {
  const userId = await authService.getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const invites = databaseService.getActiveInviteTokens()
  return { success: true, data: invites }
})
