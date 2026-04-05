import { authService } from '../../../services/auth'
import { databaseService } from '../../../services/database'

export default defineEventHandler(async (event) => {
  checkRateLimit(event, { key: 'auth:login:verify', windowMs: 60_000, maxRequests: 10 })

  const body = await readBody<{ challengeKey?: string; response?: unknown }>(event)

  if (!body?.challengeKey || !body?.response) {
    throw createError({ statusCode: 400, message: 'Missing required fields' })
  }

  try {
    const userId = await authService.verifyAuthentication(body.challengeKey, body.response as any)
    if (!userId) {
      throw createError({ statusCode: 401, message: 'Authentication failed' })
    }

    const user = databaseService.getUserById(userId)
    if (!user) {
      throw createError({ statusCode: 401, message: 'User not found' })
    }

    await authService.createSession(event, user.id)

    return { success: true, data: user }
  } catch (error) {
    throw createError({ statusCode: 500, message: extractErrorMessage(error, 'Login failed') })
  }
})
