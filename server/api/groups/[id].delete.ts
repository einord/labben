import { databaseService } from '../../services/database'

export default defineEventHandler((event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Valid group ID is required' })
  }

  try {
    databaseService.deleteGroup(id)
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw createError({ statusCode: 404, message: 'Group not found' })
    }
    throw createError({ statusCode: 500, message: 'Failed to delete group' })
  }
})
