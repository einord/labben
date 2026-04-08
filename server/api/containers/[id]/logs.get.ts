import { dockerService } from '../../../services/docker'
import { isDockerUnavailableError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Container id is required' })
  }

  const query = getQuery(event)
  const tailRaw = Array.isArray(query.tail) ? query.tail[0] : query.tail
  const tail = Math.max(1, Math.min(10000, Number(tailRaw) || 100))

  try {
    const logs = await dockerService.getContainerLogs(id, tail)
    return { success: true, data: logs }
  } catch (error) {
    if (isDockerUnavailableError(error)) {
      throw createError({ statusCode: 503, message: 'Docker daemon is not available' })
    }
    const statusCode = isNotFoundError(error) ? 404 : 500
    throw createError({
      statusCode,
      message: statusCode === 404 ? 'Container not found' : 'Failed to get container logs',
    })
  }
})
