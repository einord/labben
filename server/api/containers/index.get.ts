import { dockerService } from '../../services/docker'

export default defineEventHandler(async () => {
  try {
    const containers = await dockerService.listContainers()
    return { success: true, data: containers }
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: 'Failed to list containers',
    })
  }
})
