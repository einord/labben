import type { H3Event } from 'h3'

interface AuthenticatedUser {
  id: string
  username: string
  displayName: string
}

/** Extract authenticated user from event context (set by auth middleware) */
export function getAuthUser(event: H3Event): AuthenticatedUser | undefined {
  return (event.context as Record<string, unknown>).user as AuthenticatedUser | undefined
}
