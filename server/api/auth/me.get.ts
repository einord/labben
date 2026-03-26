import { authService } from '../../services/auth'
import { databaseService } from '../../services/database'

export default defineEventHandler(async (event) => {
  const userId = await authService.getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }
  const user = databaseService.getUserById(userId)
  if (!user) {
    throw createError({ statusCode: 401, message: 'User not found' })
  }
  return { success: true, data: user }
})
