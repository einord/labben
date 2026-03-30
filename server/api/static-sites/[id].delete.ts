import { staticSitesService } from '../../services/static-sites'
import { extractErrorMessage } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Valid site ID is required' })
  }

  try {
    const deleted = await staticSitesService.deleteSite(id)
    if (!deleted) {
      throw createError({ statusCode: 404, statusMessage: 'Site not found' })
    }
    return { success: true }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({ statusCode: 500, statusMessage: extractErrorMessage(error, 'Failed to delete site') })
  }
})
