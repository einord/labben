import { authService } from '../../../services/auth'

export default defineEventHandler(async (event) => {
  checkRateLimit(event, { key: 'auth:login:options', windowMs: 60_000, maxRequests: 10 })

  try {
    const { options, challengeKey } = await authService.getAuthenticationOptions()
    return { success: true, data: { options, challengeKey } }
  } catch (error) {
    throw createError({ statusCode: 500, message: extractErrorMessage(error, 'Failed to generate login options') })
  }
})
