import { authService } from '../services/auth'
import { databaseService } from '../services/database'

const PUBLIC_PATHS = [
  '/api/auth/setup',
  '/api/auth/login/options',
  '/api/auth/login/verify',
  '/api/auth/register/options',
  '/api/auth/register/verify',
]

export default defineEventHandler(async (event) => {
  const path = event.path

  // Only protect API routes
  if (!path.startsWith('/api/')) return

  // Allow public auth routes
  if (PUBLIC_PATHS.some(p => path.startsWith(p))) return

  // Allow invite token validation
  if (path.match(/^\/api\/auth\/invite\/[^/]+$/)) return

  // Allow health check
  if (path === '/api/health') return

  // If no users exist, only allow auth routes (initial setup)
  if (authService.isSetupRequired()) {
    if (path.startsWith('/api/auth/')) return
    throw createError({ statusCode: 403, message: 'Setup required' })
  }

  // Check session
  const userId = await authService.getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  // Verify user still exists
  const user = databaseService.getUserById(userId)
  if (!user) {
    await authService.destroySession(event)
    throw createError({ statusCode: 401, message: 'User not found' })
  }

  // Attach user to event context
  event.context.user = user
})
