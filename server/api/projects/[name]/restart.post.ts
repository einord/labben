import { dockerService } from '../../../services/docker'
import { ProjectLockError, isDockerUnavailableError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')
  if (!name) {
    throw createError({ statusCode: 400, message: 'Project name is required' })
  }

  try {
    const output = await dockerService.projectRestart(name)
    return { success: true, data: output }
  } catch (error) {
    if (isDockerUnavailableError(error)) {
      throw createError({ statusCode: 503, message: 'Docker daemon is not available' })
    }
    throw createError({
      statusCode: error instanceof ProjectLockError ? 409 : 500,
      message: extractErrorMessage(error, 'Failed to restart project'),
    })
  }
})
