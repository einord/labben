import { projectService } from '../../services/project'
import { ComposeValidationError } from '../../utils/compose'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: string; content?: string }>(event)

  const name = body?.name?.trim()
  const content = body?.content?.trim()

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Project name is required' })
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw createError({ statusCode: 400, statusMessage: 'Project name may only contain letters, digits, hyphens and underscores' })
  }

  if (!content) {
    throw createError({ statusCode: 400, statusMessage: 'Compose file content is required' })
  }

  try {
    const result = await projectService.createProject(name, content)
    return { success: true, data: result }
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      throw createError({ statusCode: 409, statusMessage: 'A project with that name already exists' })
    }

    const isYamlError = error instanceof ComposeValidationError
    throw createError({
      statusCode: isYamlError ? 400 : 500,
      statusMessage: isYamlError ? extractErrorMessage(error, 'Invalid YAML') : 'Failed to create project',
    })
  }
})
