import { dockerService } from '../../services/docker'
import { isDockerUnavailableError } from '../../utils/errors'

export default defineEventHandler(async () => {
  try {
    const containers = await dockerService.listContainers()
    return { success: true, data: containers }
  } catch (error) {
    if (isDockerUnavailableError(error)) {
      throw createError({
        statusCode: 503,
        message: 'Docker daemon is not available',
      })
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to list containers',
    })
  }
})
