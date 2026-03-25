import { projectService } from '../../services/project'

export default defineEventHandler(async () => {
  try {
    const projects = await projectService.listProjects()
    return { success: true, data: projects }
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: 'Failed to list projects',
    })
  }
})
