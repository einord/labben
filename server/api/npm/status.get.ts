import { npmApiService } from '../../services/npm-api'

export default defineEventHandler(async () => {
  try {
    const status = await npmApiService.getStatus()
    return { success: true, data: status }
  } catch (error) {
    throw createError({ statusCode: 500, message: extractErrorMessage(error, 'Failed to get NPM status') })
  }
})
