import { projectService } from '../../services/project'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ projectName?: string }>(event)
  const projectName = body?.projectName?.trim()

  if (!projectName) {
    throw createError({ statusCode: 400, message: 'Project name is required' })
  }

  try {
    projectService.setProxyProject(projectName)
    return { success: true }
  } catch (error) {
    throw createError({ statusCode: 500, message: 'Failed to set proxy project' })
  }
})
