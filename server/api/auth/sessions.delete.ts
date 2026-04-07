import { authService } from '../../services/auth'

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const currentSessionId = await authService.getSessionId(event)
  if (!currentSessionId) {
    throw createError({ statusCode: 400, message: 'No current session' })
  }

  const count = authService.revokeOtherSessions(userId, currentSessionId)

  return { success: true, data: { revoked: count } }
})
