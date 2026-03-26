import { npmApiService } from '../../../services/npm-api'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Valid proxy host ID is required' })
  }

  try {
    await npmApiService.deleteProxyHost(id)
    return { success: true }
  } catch (error) {
    throw createError({ statusCode: 500, message: extractErrorMessage(error, 'Failed to delete proxy host') })
  }
})
