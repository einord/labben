export default defineNuxtRouteMiddleware(async (to) => {
  // Allow login and invite pages without auth
  if (to.path === '/login' || to.path.startsWith('/invite/')) return

  // Only check auth on client side (SSR doesn't have browser cookies in $fetch)
  if (import.meta.server) return

  const { fetchAuthState, isAuthenticated } = useAuth()

  // Only fetch if we don't already have a user in state
  if (!isAuthenticated.value) {
    await fetchAuthState()
  }

  // If authenticated, allow through (regardless of isSetup state)
  if (isAuthenticated.value) return

  // Not authenticated — hard redirect to ensure layout resets
  if (import.meta.client) {
    window.location.href = '/login'
    return abortNavigation()
  }
  return navigateTo('/login')
})
