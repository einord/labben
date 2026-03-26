export default defineNuxtRouteMiddleware(async (to) => {
  // Allow login and invite pages without auth
  if (to.path === '/login' || to.path.startsWith('/invite/')) return

  // Only check auth on client side (SSR doesn't have browser cookies in $fetch)
  if (import.meta.server) return

  const { fetchAuthState, isAuthenticated, isSetup } = useAuth()

  // Only fetch if we don't already have a user in state
  if (!isAuthenticated.value) {
    await fetchAuthState()
  }

  // If no users exist (first-time setup), redirect to login
  if (!isSetup.value) {
    return navigateTo('/login')
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})
