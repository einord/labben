import { staticSitesService } from '../../services/static-sites'
import { extractErrorMessage } from '../../utils/errors'
import type { UpdateStaticSiteData } from '~/types/static-sites'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Valid site ID is required' })
  }

  const body = await readBody<UpdateStaticSiteData>(event)

  const data: UpdateStaticSiteData = {}
  if (body.domain !== undefined) {
    data.domain = body.domain.trim().toLowerCase()
  }
  if (body.enabled !== undefined) {
    data.enabled = body.enabled
  }

  try {
    const site = await staticSitesService.updateSite(id, data)
    if (!site) {
      throw createError({ statusCode: 404, statusMessage: 'Site not found' })
    }
    return { success: true, data: site }
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      throw createError({ statusCode: 409, statusMessage: 'A site with that domain already exists' })
    }
    if (error instanceof Error && error.message.includes('Invalid domain')) {
      throw createError({ statusCode: 400, statusMessage: error.message })
    }
    throw createError({ statusCode: 500, statusMessage: extractErrorMessage(error, 'Failed to update site') })
  }
})
