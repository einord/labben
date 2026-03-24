import { dockerService } from '../../../services/docker'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')
  if (!name) {
    throw createError({ statusCode: 400, message: 'Project name is required' })
  }

  try {
    const output = await dockerService.projectUp(name)
    return { success: true, data: output }
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: 'Failed to run docker compose up',
    })
  }
})
