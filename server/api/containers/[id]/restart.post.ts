import { dockerService } from '../../../services/docker'
import { isDockerUnavailableError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Container id is required' })
  }

  try {
    await dockerService.restartContainer(id)
    return { success: true }
  } catch (error) {
    if (isDockerUnavailableError(error)) {
      throw createError({ statusCode: 503, message: 'Docker daemon is not available' })
    }
    const statusCode = isNotFoundError(error) ? 404 : 500
    throw createError({
      statusCode,
      message: statusCode === 404 ? 'Container not found' : 'Failed to restart container',
    })
  }
})
