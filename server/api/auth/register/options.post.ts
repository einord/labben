import { randomUUID } from 'node:crypto'
import { authService } from '../../../services/auth'
import { databaseService } from '../../../services/database'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ username?: string; displayName?: string; inviteToken?: string }>(event)

  const username = body?.username?.trim()
  const displayName = body?.displayName?.trim()

  if (!username || !displayName) {
    throw createError({ statusCode: 400, message: 'Username and display name are required' })
  }

  // Check if registration is allowed
  const isSetup = !authService.isSetupRequired()
  if (isSetup) {
    // Require a valid invite token for subsequent registrations
    if (!body?.inviteToken) {
      throw createError({ statusCode: 403, message: 'Invite token is required' })
    }
    const invite = databaseService.getValidInviteToken(body.inviteToken)
    if (!invite) {
      throw createError({ statusCode: 403, message: 'Invalid or expired invite token' })
    }
  }

  // Check username uniqueness
  if (databaseService.getUserByUsername(username)) {
    throw createError({ statusCode: 409, message: 'Username already taken' })
  }

  const userId = randomUUID()

  try {
    const options = await authService.getRegistrationOptions(userId, username, displayName)
    return { success: true, data: { options, userId } }
  } catch (error) {
    throw createError({ statusCode: 500, message: extractErrorMessage(error, 'Failed to generate registration options') })
  }
})
