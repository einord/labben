import { test, expect } from '@playwright/test'

test('authenticated user sees the dashboard', async ({ page }) => {
  await page.goto('/')

  // Should NOT be redirected to login (session from auth.setup.ts)
  await expect(page).not.toHaveURL(/\/login/)
})

test('dashboard shows navigation', async ({ page }) => {
  await page.goto('/')

  // Verify the app loaded with navigation elements
  await expect(page.locator('nav')).toBeVisible()
})
