import { test, expect } from '@playwright/test'

test.describe('Nav discoverability', () => {
  test('proxy and backup nav links are always visible', async ({ page }) => {
    await page.goto('/')

    const nav = page.locator('nav')
    await expect(nav.getByText('Proxy')).toBeVisible()
    await expect(nav.getByText('Backup')).toBeVisible()
  })

  test('unconfigured features show setup badge', async ({ page }) => {
    await page.goto('/')

    // Without proxy/backup configured, the nav items should show "Setup" badges
    const nav = page.locator('nav')
    const proxyLink = nav.locator('a[href="/proxy"]')
    const backupLink = nav.locator('a[href="/backup"]')

    await expect(proxyLink).toBeVisible()
    await expect(backupLink).toBeVisible()

    // Both should have the "Setup" badge since they're unconfigured in test env
    await expect(proxyLink.getByText('Setup')).toBeVisible()
    await expect(backupLink.getByText('Setup')).toBeVisible()
  })

  test('unconfigured nav items have dimmed styling', async ({ page }) => {
    await page.goto('/')

    const proxyLink = page.locator('nav a[href="/proxy"]')
    await expect(proxyLink).toBeVisible()

    // The unconfigured class should reduce opacity
    await expect(proxyLink).toHaveClass(/unconfigured/)
  })

  test('clicking unconfigured proxy link navigates to proxy page', async ({ page }) => {
    await page.goto('/')

    await page.locator('nav a[href="/proxy"]').click()
    await expect(page).toHaveURL(/\/proxy/)
  })

  test('clicking unconfigured backup link navigates to backup page', async ({ page }) => {
    await page.goto('/')

    await page.locator('nav a[href="/backup"]').click()
    await expect(page).toHaveURL(/\/backup/)
  })
})
