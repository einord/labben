import { test as setup } from './fixtures'

const AUTH_FILE = 'e2e/.auth/user.json'

/**
 * Global setup: register a test user via the first-time setup flow
 * and save the authenticated session for reuse in all tests.
 */
setup('authenticate', async ({ page, virtualAuthenticator: _authenticator }) => {
  // Navigate directly to login — in setup mode (empty DB) it shows the registration form
  await page.goto('/login')

  // Wait for the setup form to appear (isSetup=false means registration form is shown)
  await page.getByLabel(/username/i).waitFor({ state: 'visible', timeout: 15000 })

  // Fill in the first-user setup form
  await page.getByLabel(/username/i).fill('testuser')
  await page.getByLabel(/display name/i).fill('Test User')

  // Click create account — triggers WebAuthn registration via virtual authenticator
  await page.getByRole('button', { name: /create account/i }).click()

  // Wait for redirect to dashboard after successful registration
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })

  // Save the authenticated session state (cookies)
  await page.context().storageState({ path: AUTH_FILE })
})
