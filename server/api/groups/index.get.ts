import { databaseService } from '../../services/database'

export default defineEventHandler(() => {
  try {
    const groups = databaseService.getAllGroups()
    return { success: true, data: groups }
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: 'Failed to list groups',
    })
  }
})
