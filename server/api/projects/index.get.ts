import { dockerService } from '../../services/docker'

export default defineEventHandler(async () => {
  try {
    const projects = await dockerService.listProjects()
    return { success: true, data: projects }
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: 'Failed to list projects',
    })
  }
})
