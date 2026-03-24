import { dockerService } from '../../../services/docker'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Container id is required' })
  }

  try {
    const container = await dockerService.getContainer(id)
    return { success: true, data: container }
  } catch (error) {
    const statusCode = isNotFoundError(error) ? 404 : 500
    throw createError({
      statusCode,
      message: statusCode === 404 ? 'Container not found' : 'Failed to get container',
    })
  }
})
