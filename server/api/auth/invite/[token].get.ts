import { databaseService } from '../../../services/database'

export default defineEventHandler((event) => {
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, message: 'Token is required' })
  }

  const invite = databaseService.getValidInviteToken(token)
  if (!invite) {
    throw createError({ statusCode: 404, message: 'Invalid or expired invite token' })
  }

  return { success: true, data: { valid: true } }
})
