import { npmApiService } from '../../services/npm-api'

export default defineEventHandler(() => {
  try {
    npmApiService.clearCredentials()
    return { success: true }
  } catch (error) {
    throw createError({ statusCode: 500, message: 'Failed to clear credentials' })
  }
})
