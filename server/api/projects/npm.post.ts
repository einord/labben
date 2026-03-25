import { projectService } from '../../services/project'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: string }>(event)
  const name = body?.name?.trim()

  if (!name) {
    throw createError({ statusCode: 400, message: 'Project name is required' })
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw createError({ statusCode: 400, message: 'Project name may only contain letters, digits, hyphens and underscores' })
  }

  try {
    const result = await projectService.createNpmProject(name)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      throw createError({ statusCode: 409, message: 'A project with that name already exists' })
    }
    throw createError({ statusCode: 500, message: 'Failed to create NPM project' })
  }
})
