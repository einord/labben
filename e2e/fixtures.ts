import { test as base, type BrowserContext, type CDPSession } from '@playwright/test'

export interface VirtualAuthenticator {
  authenticatorId: string
  cdpSession: CDPSession
}

/**
 * Add a virtual WebAuthn authenticator to the browser context via CDP.
 * This enables passkey registration and login without physical hardware.
 */
async function addVirtualAuthenticator(context: BrowserContext): Promise<VirtualAuthenticator> {
  const cdpSession = await context.newCDPSession(context.pages()[0] || await context.newPage())

  await cdpSession.send('WebAuthn.enable')

  const { authenticatorId } = await cdpSession.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
    },
  })

  return { authenticatorId, cdpSession }
}

/**
 * Remove a virtual authenticator and disable WebAuthn emulation.
 */
async function removeVirtualAuthenticator({ authenticatorId, cdpSession }: VirtualAuthenticator): Promise<void> {
  await cdpSession.send('WebAuthn.removeVirtualAuthenticator', { authenticatorId })
  await cdpSession.send('WebAuthn.disable')
}

/**
 * Extended test fixture that provides a virtual WebAuthn authenticator.
 * Use `authenticatedPage` for tests that need a logged-in user.
 */
export const test = base.extend<{
  virtualAuthenticator: VirtualAuthenticator
}>({
  virtualAuthenticator: async ({ context }, use) => {
    // Ensure at least one page exists for the CDP session
    if (context.pages().length === 0) {
      await context.newPage()
    }

    const authenticator = await addVirtualAuthenticator(context)
    await use(authenticator)
    await removeVirtualAuthenticator(authenticator)
  },
})

export { expect } from '@playwright/test'
export { addVirtualAuthenticator, removeVirtualAuthenticator }
