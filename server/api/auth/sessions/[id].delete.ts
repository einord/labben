import { authService } from '../../../services/auth'

export default defineEventHandler(async (event) => {
  const userId = getAuthUser(event)?.id
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const sessionId = getRouterParam(event, 'id')
  if (!sessionId) {
    throw createError({ statusCode: 400, message: 'Missing session ID' })
  }

  // Prevent revoking the current session (use logout for that)
  const currentSessionId = await authService.getSessionId(event)
  if (currentSessionId && sessionId === currentSessionId.substring(0, 16)) {
    throw createError({ statusCode: 400, message: 'Cannot revoke current session. Use logout instead.' })
  }

  const revoked = authService.revokeSession(sessionId, userId)
  if (!revoked) {
    throw createError({ statusCode: 404, message: 'Session not found' })
  }

  return { success: true }
})
