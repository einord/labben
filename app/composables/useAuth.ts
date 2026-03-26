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

  /** Register a new passkey */
  async function register(username: string, displayName: string, inviteToken?: string): Promise<boolean> {
    try {
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
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (!message.includes('cancelled') && !message.includes('canceled')) {
        const { toast, t } = useToastWithI18n()
        toast.error(t('auth.registrationFailed'), message)
      }
      return false
    }
  }

  /** Login with passkey */
  async function login(): Promise<boolean> {
    try {
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
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (!message.includes('cancelled') && !message.includes('canceled')) {
        const { toast, t } = useToastWithI18n()
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
      const { toast, t } = useToastWithI18n()
      toast.success(t('auth.credentialDeleted'))
      await fetchCredentials()
      return true
    } catch (err) {
      const { toast, t } = useToastWithI18n()
      toast.error(t('auth.credentialDeleteError'), err instanceof Error ? err.message : String(err))
      return false
    }
  }

  /** Register an additional passkey for the current user */
  async function registerAdditionalPasskey(): Promise<boolean> {
    if (!user.value) return false
    try {
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

      const { toast, t } = useToastWithI18n()
      toast.success(t('auth.passkeyRegistered'))
      await fetchCredentials()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (!message.includes('cancelled') && !message.includes('canceled')) {
        const { toast, t } = useToastWithI18n()
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
      const { toast, t } = useToastWithI18n()
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

/** Helper to get toast and i18n inside async functions called from component context */
function useToastWithI18n() {
  return { toast: useToast(), t: useI18n().t }
}
