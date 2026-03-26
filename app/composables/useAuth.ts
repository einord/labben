import { startRegistration, startAuthentication } from '@simplewebauthn/browser'
import type { User, AuthState, WebAuthnCredentialInfo, InviteInfo } from '~/types/auth'

export function useAuth() {
  const user = useState<User | null>('auth-user', () => null)
  const isSetup = useState<boolean>('auth-setup', () => true)
  const credentials = ref<WebAuthnCredentialInfo[]>([])

  const isAuthenticated = computed(() => user.value !== null)

  /** Fetch auth state (setup status + current user) — safe to call outside setup */
  async function fetchAuthState(): Promise<AuthState> {
    try {
      const setupRes = await $fetch<{ success: boolean; data: { isSetup: boolean } }>('/api/auth/setup')
      isSetup.value = setupRes.data.isSetup

      if (isSetup.value) {
        try {
          const meRes = await $fetch<{ success: boolean; data: User }>('/api/auth/me')
          user.value = meRes.data
        } catch {
          user.value = null
        }
      }
    } catch {
      isSetup.value = false
      user.value = null
    }

    return { user: user.value, isSetup: isSetup.value }
  }

  /** Register a new passkey. Returns the user on success, throws on failure. */
  async function register(username: string, displayName: string, inviteToken?: string): Promise<User> {
    const optionsRes = await $fetch<{ success: boolean; data: { options: unknown; userId: string } }>(
      '/api/auth/register/options',
      { method: 'POST', body: { username, displayName, inviteToken } },
    )

    const credential = await startRegistration({ optionsJSON: optionsRes.data.options as any })

    const verifyRes = await $fetch<{ success: boolean; data: User }>(
      '/api/auth/register/verify',
      {
        method: 'POST',
        body: {
          userId: optionsRes.data.userId,
          username,
          displayName,
          response: credential,
          inviteToken,
        },
      },
    )

    user.value = verifyRes.data
    return verifyRes.data
  }

  /** Login with passkey. Returns the user on success, throws on failure. */
  async function login(): Promise<User> {
    const optionsRes = await $fetch<{ success: boolean; data: { options: unknown; challengeKey: string } }>(
      '/api/auth/login/options',
      { method: 'POST' },
    )

    const credential = await startAuthentication({ optionsJSON: optionsRes.data.options as any })

    const verifyRes = await $fetch<{ success: boolean; data: User }>(
      '/api/auth/login/verify',
      {
        method: 'POST',
        body: {
          challengeKey: optionsRes.data.challengeKey,
          response: credential,
        },
      },
    )

    user.value = verifyRes.data
    return verifyRes.data
  }

  /** Logout */
  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignore errors
    }
    user.value = null
    navigateTo('/login')
  }

  /** Fetch registered credentials for current user */
  async function fetchCredentials() {
    try {
      const res = await $fetch<{ success: boolean; data: WebAuthnCredentialInfo[] }>('/api/auth/credentials')
      credentials.value = res.data
    } catch {
      credentials.value = []
    }
  }

  /** Delete a credential. Throws on failure. */
  async function deleteCredential(id: string): Promise<void> {
    await $fetch(`/api/auth/credentials/${id}`, { method: 'DELETE' })
    await fetchCredentials()
  }

  /** Register an additional passkey for the current user. Throws on failure. */
  async function registerAdditionalPasskey(): Promise<void> {
    if (!user.value) throw new Error('Not authenticated')

    const optionsRes = await $fetch<{ success: boolean; data: { options: unknown; userId: string } }>(
      '/api/auth/register/options',
      { method: 'POST', body: { username: user.value.username, displayName: user.value.displayName } },
    )

    const credential = await startRegistration({ optionsJSON: optionsRes.data.options as any })

    await $fetch('/api/auth/register/verify', {
      method: 'POST',
      body: {
        userId: user.value.id,
        username: user.value.username,
        displayName: user.value.displayName,
        response: credential,
      },
    })

    await fetchCredentials()
  }

  /** Create an invite link. Throws on failure. */
  async function createInvite(): Promise<InviteInfo> {
    const res = await $fetch<{ success: boolean; data: { token: string; expiresAt: string } }>(
      '/api/auth/invite',
      { method: 'POST' },
    )
    const origin = import.meta.client ? window.location.origin : ''
    return {
      token: res.data.token,
      url: `${origin}/invite/${res.data.token}`,
      expiresAt: res.data.expiresAt,
    }
  }

  return {
    user,
    isSetup,
    isAuthenticated,
    credentials,
    fetchAuthState,
    register,
    login,
    logout,
    fetchCredentials,
    deleteCredential,
    registerAdditionalPasskey,
    createInvite,
  }
}
