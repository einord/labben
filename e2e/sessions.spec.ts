import { test, expect } from '@playwright/test'

test.describe('Session management', () => {
  test('settings shows sessions section with current session', async ({ page }) => {
    await page.goto('/')

    // Open settings modal
    await page.getByRole('button', { name: /settings/i }).click()

    // Navigate to account section
    await page.getByText('Account').click()

    // Verify sessions section is visible
    await expect(page.getByRole('heading', { name: /sessions/i })).toBeVisible()

    // Should show current session marker
    await expect(page.getByText(/current session/i)).toBeVisible()
  })

  test('sessions list shows at least one session', async ({ page }) => {
    await page.goto('/')

    // Open settings modal
    await page.getByRole('button', { name: /settings/i }).click()
    await page.getByText('Account').click()

    // Should show the "no other sessions" message since we only have one session
    await expect(page.getByText(/no other active sessions/i)).toBeVisible()
  })

  test('sessions API returns current session data', async ({ request }) => {
    const response = await request.get('/api/auth/sessions')
    expect(response.ok()).toBeTruthy()

    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeInstanceOf(Array)
    expect(body.data.length).toBeGreaterThanOrEqual(1)

    // At least one session should be marked as current
    const currentSession = body.data.find((s: { isCurrent: boolean }) => s.isCurrent)
    expect(currentSession).toBeTruthy()
    expect(currentSession.userAgent).toBeTruthy()
  })

  test('cannot revoke current session via API', async ({ request }) => {
    // First get sessions to find current session ID
    const sessionsRes = await request.get('/api/auth/sessions')
    const sessions = await sessionsRes.json()
    const currentSession = sessions.data.find((s: { isCurrent: boolean }) => s.isCurrent)

    // Trying to delete current session should fail
    const deleteRes = await request.delete(`/api/auth/sessions/${currentSession.id}`)
    expect(deleteRes.status()).toBe(400)
  })

  test('revoke all other sessions returns success when no others exist', async ({ request }) => {
    const response = await request.delete('/api/auth/sessions')
    expect(response.ok()).toBeTruthy()

    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.revoked).toBe(0)
  })
})
