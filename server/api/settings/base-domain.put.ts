import { npmApiService } from '../../services/npm-api'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ baseDomain?: string }>(event)
  const baseDomain = body?.baseDomain?.trim()

  if (!baseDomain) {
    throw createError({ statusCode: 400, message: 'Base domain is required' })
  }

  try {
    npmApiService.setBaseDomain(baseDomain)
    return { success: true }
  } catch (error) {
    throw createError({ statusCode: 500, message: 'Failed to set base domain' })
  }
})
