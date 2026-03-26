import { npmApiService } from '../../services/npm-api'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ oldPassword?: string; newPassword?: string }>(event)

  const oldPassword = body?.oldPassword
  const newPassword = body?.newPassword

  if (!oldPassword || !newPassword) {
    throw createError({ statusCode: 400, message: 'Old and new passwords are required' })
  }

  if (newPassword.length < 8) {
    throw createError({ statusCode: 400, message: 'New password must be at least 8 characters' })
  }

  try {
    await npmApiService.changePassword(oldPassword, newPassword)
    return { success: true }
  } catch (error) {
    throw createError({ statusCode: 500, message: extractErrorMessage(error, 'Failed to change password') })
  }
})
