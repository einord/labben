import { authService } from '../../services/auth'

export default defineEventHandler(async (event) => {
  const userId = await authService.getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  try {
    const { token, expiresAt } = authService.generateInviteToken(userId)
    return { success: true, data: { token, expiresAt } }
  } catch (error) {
    throw createError({ statusCode: 500, message: extractErrorMessage(error, 'Failed to create invite') })
  }
})
