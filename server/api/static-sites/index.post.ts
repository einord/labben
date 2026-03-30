import { staticSitesService } from '../../services/static-sites'
import { extractErrorMessage } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ domain?: string }>(event)

  const domain = body?.domain?.trim().toLowerCase()

  if (!domain) {
    throw createError({ statusCode: 400, statusMessage: 'Domain is required' })
  }

  try {
    const site = await staticSitesService.createSite(domain)
    return { success: true, data: site }
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      throw createError({ statusCode: 409, statusMessage: 'A site with that domain already exists' })
    }
    if (error instanceof Error && error.message.includes('Invalid domain')) {
      throw createError({ statusCode: 400, statusMessage: error.message })
    }
    throw createError({ statusCode: 500, statusMessage: extractErrorMessage(error, 'Failed to create site') })
  }
})
