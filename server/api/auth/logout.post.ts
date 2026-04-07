import { authService } from '../../services/auth'

export default defineEventHandler(async (event) => {
  // destroySession removes both the DB record and the cookie
  await authService.destroySession(event)
  return { success: true }
})
