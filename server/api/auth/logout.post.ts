import { authService } from '../../services/auth'

export default defineEventHandler(async (event) => {
  await authService.destroySession(event)
  return { success: true }
})
