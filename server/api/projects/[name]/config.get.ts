import { dockerService } from '../../../services/docker'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')
  if (!name) {
    throw createError({ statusCode: 400, message: 'Project name is required' })
  }

  try {
    const config = await dockerService.getProjectConfig(name)
    return { success: true, data: config }
  } catch (error) {
    const statusCode = isFileNotFound(error) ? 404 : 500
    throw createError({
      statusCode,
      message: statusCode === 404 ? 'Project config not found' : 'Failed to read project config',
    })
  }
})

function isFileNotFound(error: unknown): boolean {
  return error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT'
}
