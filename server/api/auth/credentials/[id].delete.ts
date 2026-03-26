import { authService } from '../../../services/auth'
import { databaseService } from '../../../services/database'

export default defineEventHandler(async (event) => {
  const userId = await authService.getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Credential ID is required' })
  }

  // Verify the credential belongs to this user
  const credential = databaseService.getCredentialById(id)
  if (!credential || credential.userId !== userId) {
    throw createError({ statusCode: 404, message: 'Credential not found' })
  }

  // Don't allow deleting the last credential
  const allCredentials = databaseService.getCredentialsByUserId(userId)
  if (allCredentials.length <= 1) {
    throw createError({ statusCode: 400, message: 'Cannot delete last credential' })
  }

  databaseService.deleteCredential(id)
  return { success: true }
})
