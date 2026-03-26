import { npmApiService } from '../../services/npm-api'

export default defineEventHandler(() => {
  try {
    const baseDomain = npmApiService.getBaseDomain()
    return { success: true, data: { baseDomain } }
  } catch (error) {
    throw createError({ statusCode: 500, message: 'Failed to get base domain' })
  }
})
