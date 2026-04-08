import { staticSitesService } from '../../../services/static-sites'
import { extractErrorMessage, isDockerUnavailableError } from '../../../utils/errors'

export default defineEventHandler(async () => {
  try {
    await staticSitesService.startContainer()
    return { success: true }
  } catch (error) {
    if (isDockerUnavailableError(error)) {
      throw createError({ statusCode: 503, message: 'Docker daemon is not available' })
    }
    throw createError({ statusCode: 500, statusMessage: extractErrorMessage(error, 'Failed to start static sites container') })
  }
})
