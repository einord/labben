import { projectService } from '../../services/project'

export default defineEventHandler(() => {
  try {
    const proxyProject = projectService.getProxyProject()
    return { success: true, data: { proxyProject } }
  } catch (error) {
    throw createError({ statusCode: 500, message: 'Failed to get proxy settings' })
  }
})
