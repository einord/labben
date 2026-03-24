import { dockerService } from '../../services/docker'

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
    const result = await dockerService.createProject(name, content)
    return { success: true, data: result }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'

    if (message.includes('already exists')) {
      throw createError({ statusCode: 409, statusMessage: message })
    }

    throw createError({ statusCode: 500, statusMessage: message })
  }
})
