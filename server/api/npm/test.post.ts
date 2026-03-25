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
    const connected = await npmApiService.testConnection(url, email, password)
    return { success: true, data: { connected } }
  } catch (error) {
    throw createError({ statusCode: 500, message: 'Failed to test connection' })
  }
})
