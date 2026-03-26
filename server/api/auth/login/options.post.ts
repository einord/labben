import { authService } from '../../../services/auth'

export default defineEventHandler(async () => {
  try {
    const { options, challengeKey } = await authService.getAuthenticationOptions()
    return { success: true, data: { options, challengeKey } }
  } catch (error) {
    throw createError({ statusCode: 500, message: extractErrorMessage(error, 'Failed to generate login options') })
  }
})
