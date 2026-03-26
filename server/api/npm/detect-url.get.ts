import { npmApiService } from '../../services/npm-api'

export default defineEventHandler(async () => {
  try {
    const url = await npmApiService.detectNpmUrl()
    return { success: true, data: { url } }
  } catch (error) {
    throw createError({ statusCode: 500, message: extractErrorMessage(error, 'Failed to detect NPM URL') })
  }
})
