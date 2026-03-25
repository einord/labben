import { databaseService } from '../../services/database'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Valid group ID is required' })
  }

  const body = await readBody<{ name?: string; sortOrder?: number }>(event)

  if (body.name !== undefined && !body.name.trim()) {
    throw createError({ statusCode: 400, message: 'Group name cannot be empty' })
  }

  try {
    const group = databaseService.updateGroup(id, {
      name: body.name?.trim(),
      sortOrder: body.sortOrder,
    })
    return { success: true, data: group }
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw createError({ statusCode: 404, message: 'Group not found' })
    }
    throw createError({ statusCode: 500, message: 'Failed to update group' })
  }
})
