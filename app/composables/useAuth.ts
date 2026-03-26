import { startRegistration, startAuthentication } from '@simplewebauthn/browser'
import type { User, AuthState, WebAuthnCredentialInfo, InviteInfo } from '~/types/auth'

export function useAuth() {
  const user = useState<User | null>('auth-user', () => null)
  const isSetup = useState<boolean>('auth-setup', () => true)
  const credentials = ref<WebAuthnCredentialInfo[]>([])
  const toast = useToast()
  const { t } = useI18n()

  const isAuthenticated = computed(() => user.value !== null)

  /** Fetch auth state (setup status + current user) */
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

  /** Register a new passkey */
  async function register(username: string, displayName: string, inviteToken?: string): Promise<boolean> {
    try {
      // Step 1: Get registration options from server
      const optionsRes = await $fetch<{ success: boolean; data: { options: any; userId: string } }>(
        '/api/auth/register/options',
        { method: 'POST', body: { username, displayName, inviteToken } },
      )

      // Step 2: Create credential in browser
      const credential = await startRegistration({ optionsJSON: optionsRes.data.options })

      // Step 3: Verify with server
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
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      // Don't show toast for user cancellation
      if (!message.includes('cancelled') && !message.includes('canceled')) {
        toast.error(t('auth.registrationFailed'), message)
      }
      return false
    }
  }

  /** Login with passkey */
  async function login(): Promise<boolean> {
    try {
      // Step 1: Get authentication options
      const optionsRes = await $fetch<{ success: boolean; data: { options: any; challengeKey: string } }>(
        '/api/auth/login/options',
        { method: 'POST' },
      )

      // Step 2: Authenticate in browser
      const credential = await startAuthentication({ optionsJSON: optionsRes.data.options })

      // Step 3: Verify with server
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
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (!message.includes('cancelled') && !message.includes('canceled')) {
        toast.error(t('auth.loginFailed'), message)
      }
      return false
    }
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

  /** Delete a credential */
  async function deleteCredential(id: string): Promise<boolean> {
    try {
      await $fetch(`/api/auth/credentials/${id}`, { method: 'DELETE' })
      toast.success(t('auth.credentialDeleted'))
      await fetchCredentials()
      return true
    } catch (err) {
      toast.error(t('auth.credentialDeleteError'), err instanceof Error ? err.message : String(err))
      return false
    }
  }

  /** Register an additional passkey for the current user */
  async function registerAdditionalPasskey(): Promise<boolean> {
    if (!user.value) return false
    try {
      const optionsRes = await $fetch<{ success: boolean; data: { options: any; userId: string } }>(
        '/api/auth/register/options',
        { method: 'POST', body: { username: user.value.username, displayName: user.value.displayName } },
      )

      const credential = await startRegistration({ optionsJSON: optionsRes.data.options })

      await $fetch('/api/auth/register/verify', {
        method: 'POST',
        body: {
          userId: user.value.id,
          username: user.value.username,
          displayName: user.value.displayName,
          response: credential,
        },
      })

      toast.success(t('auth.passkeyRegistered'))
      await fetchCredentials()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (!message.includes('cancelled') && !message.includes('canceled')) {
        toast.error(t('auth.registrationFailed'), message)
      }
      return false
    }
  }

  /** Create an invite link */
  async function createInvite(): Promise<InviteInfo | null> {
    try {
      const res = await $fetch<{ success: boolean; data: { token: string; expiresAt: string } }>(
        '/api/auth/invite',
        { method: 'POST' },
      )
      const origin = window.location.origin
      return {
        token: res.data.token,
        url: `${origin}/invite/${res.data.token}`,
        expiresAt: res.data.expiresAt,
      }
    } catch (err) {
      toast.error(t('auth.inviteError'), err instanceof Error ? err.message : String(err))
      return null
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
