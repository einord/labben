import { dockerService } from '../../../services/docker'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Container id is required' })
  }

  try {
    await dockerService.restartContainer(id)
    return { success: true }
  } catch (error) {
    const statusCode = isNotFoundError(error) ? 404 : 500
    throw createError({
      statusCode,
      message: statusCode === 404 ? 'Container not found' : 'Failed to restart container',
    })
  }
})
