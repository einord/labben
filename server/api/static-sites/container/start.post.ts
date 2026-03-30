import { staticSitesService } from '../../../services/static-sites'
import { extractErrorMessage } from '../../../utils/errors'

export default defineEventHandler(async () => {
  try {
    await staticSitesService.startContainer()
    return { success: true }
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: extractErrorMessage(error, 'Failed to start static sites container') })
  }
})
