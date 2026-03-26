export default defineNuxtRouteMiddleware(async (to) => {
  // Allow login and invite pages without auth
  if (to.path === '/login' || to.path.startsWith('/invite/')) return

  const { fetchAuthState, isAuthenticated, isSetup } = useAuth()
  await fetchAuthState()

  // If no users exist (first-time setup), redirect to login
  if (!isSetup.value) {
    return navigateTo('/login')
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})
