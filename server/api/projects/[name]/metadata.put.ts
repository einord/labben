import { projectService } from '../../../services/project'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')
  if (!name) {
    throw createError({ statusCode: 400, message: 'Project name is required' })
  }

  const body = await readBody<{ groupId?: number | null; displayName?: string | null }>(event)

  try {
    if (body.groupId !== undefined) {
      projectService.assignGroup(name, body.groupId)
    }
    if (body.displayName !== undefined) {
      projectService.updateDisplayName(name, body.displayName)
    }
    return { success: true }
  } catch (error) {
    throw createError({ statusCode: 500, message: 'Failed to update project metadata' })
  }
})
