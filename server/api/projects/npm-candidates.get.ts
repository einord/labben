import { projectService } from '../../services/project'

export default defineEventHandler(async () => {
  try {
    const candidates = await projectService.getNpmCandidates()
    return { success: true, data: candidates }
  } catch (error) {
    throw createError({ statusCode: 500, message: 'Failed to list NPM candidates' })
  }
})
