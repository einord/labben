import { databaseService } from '../../services/database'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: string }>(event)
  const name = body?.name?.trim()

  if (!name) {
    throw createError({ statusCode: 400, message: 'Group name is required' })
  }

  try {
    const group = databaseService.createGroup(name)
    return { success: true, data: group }
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      throw createError({ statusCode: 409, message: 'A group with that name already exists' })
    }
    throw createError({ statusCode: 500, message: 'Failed to create group' })
  }
})
