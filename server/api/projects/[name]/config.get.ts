import { dockerService } from '../../../services/docker'
import { isDockerUnavailableError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')
  if (!name) {
    throw createError({ statusCode: 400, message: 'Project name is required' })
  }

  try {
    const config = await dockerService.getProjectConfig(name)
    return { success: true, data: config }
  } catch (error) {
    if (isDockerUnavailableError(error)) {
      throw createError({ statusCode: 503, message: 'Docker daemon is not available' })
    }
    const statusCode = isFileNotFoundError(error) ? 404 : 500
    throw createError({
      statusCode,
      message: statusCode === 404 ? 'Project config not found' : 'Failed to read project config',
    })
  }
})
