import { dockerService } from '../../../services/docker'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Container id is required' })
  }

  const query = getQuery(event)
  const tail = Math.max(1, Math.min(10000, Number(query.tail) || 100))

  try {
    const logs = await dockerService.getContainerLogs(id, tail)
    return { success: true, data: logs }
  } catch (error) {
    const statusCode = isNotFoundError(error) ? 404 : 500
    throw createError({
      statusCode,
      message: statusCode === 404 ? 'Container not found' : 'Failed to get container logs',
    })
  }
})
