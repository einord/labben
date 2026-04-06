import { authService } from '../../services/auth'

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const currentSessionId = await authService.getSessionId(event)
  const sessions = authService.getSessionsForUser(userId, currentSessionId)

  return { success: true, data: sessions }
})
