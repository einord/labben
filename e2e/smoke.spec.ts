import { test, expect } from '@playwright/test'

/**
 * Smoke tests: verify every main page renders without fatal errors.
 * These catch SSR crashes, composable misuse, missing imports, and
 * other runtime errors that unit tests and type checks cannot detect.
 */

const AUTHENTICATED_PAGES = [
  { path: '/', name: 'Dashboard' },
  { path: '/projects', name: 'Projects' },
  { path: '/proxy', name: 'Proxy' },
  { path: '/backup', name: 'Backup' },
  { path: '/sites', name: 'Static Sites' },
]

for (const { path, name } of AUTHENTICATED_PAGES) {
  test(`${name} (${path}) renders without server errors`, async ({ page }) => {
    const serverErrors: string[] = []

    // Capture console errors from the browser
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        serverErrors.push(msg.text())
      }
    })

    const response = await page.goto(path)

    // HTTP response must be successful (not 500, 502, etc.)
    expect(response?.status(), `${name} returned HTTP ${response?.status()}`).toBeLessThan(500)

    // Must not show a Nuxt/Nitro error page
    await expect(page.locator('text=Internal Server Error')).not.toBeVisible()
    await expect(page.locator('text=500')).not.toBeVisible()

    // The main layout must render (sidebar + main content area)
    await expect(page.locator('nav')).toBeVisible()

    // No uncaught runtime errors in the browser console
    const critical = serverErrors.filter(
      (e) => e.includes('Must be called') || e.includes('is not a function') || e.includes('is not defined'),
    )
    expect(critical, `Unexpected console errors on ${name}:\n${critical.join('\n')}`).toHaveLength(0)
  })
}

test('Login page renders without server errors', async ({ browser }) => {
  // Use a fresh context without saved auth state
  const context = await browser.newContext()
  const page = await context.newPage()

  const response = await page.goto('/login')

  expect(response?.status(), `Login returned HTTP ${response?.status()}`).toBeLessThan(500)
  await expect(page.locator('text=Internal Server Error')).not.toBeVisible()

  await context.close()
})
