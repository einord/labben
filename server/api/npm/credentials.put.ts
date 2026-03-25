import { npmApiService } from '../../services/npm-api'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ url?: string; email?: string; password?: string }>(event)

  const url = body?.url?.trim()
  const email = body?.email?.trim()
  const password = body?.password

  if (!url || !email || !password) {
    throw createError({ statusCode: 400, message: 'URL, email, and password are required' })
  }

  try {
    // Test connection before saving
    const connected = await npmApiService.testConnection(url, email, password)
    if (!connected) {
      throw createError({ statusCode: 401, message: 'Could not connect with the provided credentials' })
    }

    npmApiService.saveCredentials(url, email, password)
    return { success: true }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({ statusCode: 500, message: 'Failed to save credentials' })
  }
})
