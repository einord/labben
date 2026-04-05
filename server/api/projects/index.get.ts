import { projectService } from '../../services/project'
import { isDockerUnavailableError } from '../../utils/errors'

export default defineEventHandler(async () => {
  try {
    const projects = await projectService.listProjects()
    return { success: true, data: projects }
  } catch (error) {
    if (isDockerUnavailableError(error)) {
      throw createError({
        statusCode: 503,
        message: 'Docker daemon is not available',
      })
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to list projects',
    })
  }
})
