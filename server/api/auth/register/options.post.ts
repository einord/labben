import { randomUUID } from 'node:crypto'
import { authService } from '../../../services/auth'
import { databaseService } from '../../../services/database'

export default defineEventHandler(async (event) => {
  checkRateLimit(event, { key: 'auth:register:options', windowMs: 60_000, maxRequests: 5 })

  const body = await readBody<{ username?: string; displayName?: string; inviteToken?: string }>(event)

  const username = body?.username?.trim()
  const displayName = body?.displayName?.trim()

  if (!username || !displayName) {
    throw createError({ statusCode: 400, message: 'Username and display name are required' })
  }

  // Check if this is an authenticated user adding a new passkey
  const sessionUserId = await authService.getSessionUserId(event)
  const isAddingPasskey = sessionUserId && databaseService.getUserById(sessionUserId)

  if (!isAddingPasskey) {
    // New user registration — check if allowed
    const isSetup = !authService.isSetupRequired()
    if (isSetup) {
      if (!body?.inviteToken) {
        throw createError({ statusCode: 403, message: 'Invite token is required' })
      }
      const invite = databaseService.getValidInviteToken(body.inviteToken)
      if (!invite) {
        throw createError({ statusCode: 403, message: 'Invalid or expired invite token' })
      }
    }

    // Check username uniqueness for new users
    if (databaseService.getUserByUsername(username)) {
      throw createError({ statusCode: 409, message: 'Username already taken' })
    }
  }

  // Use existing user ID for adding passkey, or generate new one
  const userId = sessionUserId ?? randomUUID()

  try {
    const options = await authService.getRegistrationOptions(userId, username, displayName)
    return { success: true, data: { options, userId } }
  } catch (error) {
    throw createError({ statusCode: 500, message: extractErrorMessage(error, 'Failed to generate registration options') })
  }
})
