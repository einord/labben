import { dockerService } from '../../services/docker'
import { isDockerUnavailableError } from '../../utils/errors'

/** Lightweight endpoint returning only container status fields — designed for polling. */
export default defineEventHandler(async () => {
  try {
    const statuses = await dockerService.listContainerStatuses()
    return { success: true, data: statuses }
  } catch (error) {
    if (isDockerUnavailableError(error)) {
      throw createError({
        statusCode: 503,
        message: 'Docker daemon is not available',
      })
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch container statuses',
    })
  }
})
