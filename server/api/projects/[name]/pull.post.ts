import { dockerService } from '../../../services/docker'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')
  if (!name) {
    throw createError({ statusCode: 400, message: 'Project name is required' })
  }

  try {
    const output = await dockerService.projectPull(name)
    return { success: true, data: output }
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: extractErrorMessage(error, 'Failed to run docker compose pull'),
    })
  }
})
