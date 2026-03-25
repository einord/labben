import { npmApiService } from '../../services/npm-api'

export default defineEventHandler(async () => {
  try {
    const hosts = await npmApiService.listProxyHosts()
    return { success: true, data: hosts }
  } catch (error) {
    throw createError({ statusCode: 500, message: 'Failed to list proxy hosts' })
  }
})
