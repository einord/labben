import { authService } from '../../../services/auth'
import { databaseService } from '../../../services/database'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ userId?: string; username?: string; displayName?: string; response?: unknown; inviteToken?: string }>(event)

  if (!body?.userId || !body?.username || !body?.displayName || !body?.response) {
    throw createError({ statusCode: 400, message: 'Missing required fields' })
  }

  try {
    // Check if this is an existing user adding a passkey
    const existingUser = databaseService.getUserById(body.userId)

    if (existingUser) {
      // Verify the authenticated session owns this account
      const sessionUserId = await authService.getSessionUserId(event)
      if (!sessionUserId || sessionUserId !== body.userId) {
        throw createError({ statusCode: 403, message: 'Cannot add passkey to another user\'s account' })
      }

      // Adding a new passkey to existing account
      const verified = await authService.verifyAndStoreRegistration(body.userId, body.response as any)
      if (!verified) {
        throw createError({ statusCode: 400, message: 'Registration verification failed' })
      }
      return { success: true, data: existingUser }
    }

    // New user registration — create user first (credential has FK to user)
    const user = databaseService.createUser(body.userId, body.username.trim(), body.displayName.trim())

    const verified = await authService.verifyAndStoreRegistration(body.userId, body.response as any)
    if (!verified) {
      databaseService.deleteUser(body.userId)
      throw createError({ statusCode: 400, message: 'Registration verification failed' })
    }

    if (body.inviteToken) {
      databaseService.markInviteUsed(body.inviteToken, user.id)
    }

    await authService.createSession(event, user.id)
    return { success: true, data: user }
  } catch (error) {
    // Re-throw H3 errors (4xx, etc.) with their original status code
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({ statusCode: 500, message: extractErrorMessage(error, 'Registration failed') })
  }
})
