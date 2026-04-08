import { projectService } from '../../services/project'
import { isDockerUnavailableError } from '../../utils/errors'

export default defineEventHandler(async () => {
  try {
    const candidates = await projectService.getNpmCandidates()
    return { success: true, data: candidates }
  } catch (error) {
    if (isDockerUnavailableError(error)) {
      throw createError({ statusCode: 503, message: 'Docker daemon is not available' })
    }
    throw createError({ statusCode: 500, message: 'Failed to list NPM candidates' })
  }
})
