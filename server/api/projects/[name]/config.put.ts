import { dockerService } from '../../../services/docker'
import { isDockerUnavailableError } from '../../../utils/errors'
import { ComposeValidationError } from '../../../utils/compose'

interface ConfigBody {
  content: string
}

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')
  if (!name) {
    throw createError({ statusCode: 400, message: 'Project name is required' })
  }

  const body = await readBody<ConfigBody>(event)
  if (!body?.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
    throw createError({ statusCode: 400, message: 'Content must be a non-empty string' })
  }

  try {
    await dockerService.saveProjectConfig(name, body.content)
    return { success: true }
  } catch (error) {
    if (isDockerUnavailableError(error)) {
      throw createError({ statusCode: 503, message: 'Docker daemon is not available' })
    }
    const message = extractErrorMessage(error, 'Failed to save project config')
    throw createError({
      statusCode: error instanceof ComposeValidationError ? 400 : 500,
      message,
    })
  }
})
