import { authService } from '../../../services/auth'
import { databaseService } from '../../../services/database'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ userId?: string; username?: string; displayName?: string; response?: unknown; inviteToken?: string }>(event)

  if (!body?.userId || !body?.username || !body?.displayName || !body?.response) {
    throw createError({ statusCode: 400, message: 'Missing required fields' })
  }

  try {
    // Create the user first (credential has a foreign key to user)
    const user = databaseService.createUser(body.userId, body.username.trim(), body.displayName.trim())

    // Verify and store the credential
    const verified = await authService.verifyAndStoreRegistration(body.userId, body.response as any)
    if (!verified) {
      // Rollback: remove the user if verification failed
      databaseService.deleteUser(body.userId)
      throw createError({ statusCode: 400, message: 'Registration verification failed' })
    }

    // Mark invite token as used if provided
    if (body.inviteToken) {
      databaseService.markInviteUsed(body.inviteToken, user.id)
    }

    // Create session
    await authService.createSession(event, user.id)

    return { success: true, data: user }
  } catch (error) {
    throw createError({ statusCode: 500, message: extractErrorMessage(error, 'Registration failed') })
  }
})
