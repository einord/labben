import { projectService } from '../../services/project'

export default defineEventHandler(() => {
  try {
    projectService.clearProxyProject()
    return { success: true }
  } catch (error) {
    throw createError({ statusCode: 500, message: 'Failed to clear proxy project' })
  }
})
