import { staticSitesService } from '../../services/static-sites'
import { extractErrorMessage } from '../../utils/errors'

export default defineEventHandler(async () => {
  try {
    const status = await staticSitesService.getStatus()
    return { success: true, data: status }
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: extractErrorMessage(error, 'Failed to get static sites status') })
  }
})
