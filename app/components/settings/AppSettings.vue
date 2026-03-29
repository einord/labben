<script setup lang="ts">
import type { SettingsSection } from '~/components/ui/UiSettingsModal.types'
import type { ThemeMode } from '~/composables/useTheme'

interface AppSettingsProps {
  modelValue: boolean
}

const props = defineProps<AppSettingsProps>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { config, getPalettes, setPalette, setMode } = useTheme()
const { locale, locales, setLocale, t } = useI18n()
const { user, credentials, fetchCredentials, deleteCredential, registerAdditionalPasskey, invites, fetchInvites, deleteInvite, createInvite } = useAuth()
const toast = useToast()

const inviteLink = ref<string | null>(null)
const registeringPasskey = ref(false)
const { status: systemStatus, fetchStatus: fetchSystemStatus } = useSystemStatus()

const sections = computed<SettingsSection[]>(() => [
  { id: 'account', label: t('auth.account'), icon: 'lucide:user' },
  { id: 'proxy', label: t('nav.proxy'), icon: 'lucide:route' },
  { id: 'backup', label: t('nav.backup'), icon: 'lucide:hard-drive-download' },
  { id: 'appearance', label: t('settings.appearance'), icon: 'lucide:palette' },
  { id: 'language', label: t('settings.language'), icon: 'lucide:languages' },
  { id: 'about', label: t('settings.about'), icon: 'lucide:info' },
])

async function handleRegisterPasskey() {
  registeringPasskey.value = true
  try {
    await registerAdditionalPasskey()
    toast.success(t('auth.passkeyRegistered'))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('cancelled') || msg.includes('canceled') || msg.includes('AbortError')) {
      // User cancelled — do nothing
    } else if (msg.includes('previously registered') || msg.includes('already registered')) {
      toast.error(t('auth.alreadyRegistered'))
    } else {
      toast.error(t('auth.registrationFailed'), msg)
    }
  } finally {
    registeringPasskey.value = false
  }
}

async function handleDeleteCredential(id: string) {
  try {
    await deleteCredential(id)
    toast.success(t('auth.credentialDeleted'))
  } catch (err) {
    toast.error(t('auth.credentialDeleteError'), err instanceof Error ? err.message : String(err))
  }
}

async function handleCreateInvite() {
  try {
    const invite = await createInvite()
    inviteLink.value = invite.url
    await fetchInvites()
    try {
      await navigator.clipboard.writeText(invite.url)
      toast.success(t('auth.inviteCopied'))
    } catch {
      // Clipboard access denied — link is still visible in the UI
    }
  } catch (err) {
    toast.error(t('auth.inviteError'), err instanceof Error ? err.message : String(err))
  }
}

async function handleDeleteInvite(token: string) {
  try {
    await deleteInvite(token)
  } catch (err) {
    toast.error(t('auth.inviteError'), err instanceof Error ? err.message : String(err))
  }
}

async function copyInviteLink() {
  if (!inviteLink.value) return
  try {
    await navigator.clipboard.writeText(inviteLink.value)
    toast.success(t('auth.inviteCopied'))
  } catch {
    // Clipboard not available
  }
}

function onSectionChange(sectionId: string) {
  if (sectionId === 'account') {
    fetchCredentials()
    inviteLink.value = null
  }
}

const modes = computed(() => [
  { value: 'light' as ThemeMode, label: t('settings.light'), icon: 'lucide:sun' },
  { value: 'dark' as ThemeMode, label: t('settings.dark'), icon: 'lucide:moon' },
  { value: 'auto' as ThemeMode, label: t('settings.auto'), icon: 'lucide:monitor' },
])

const availableLocales = computed(() => {
  return (locales.value as Array<{ code: string; name: string }>)
})

const palettes = getPalettes()

// Load data when modal opens
watch(() => props.modelValue, (open) => {
  if (open) {
    fetchCredentials()
    fetchInvites()
    fetchSystemStatus()
    inviteLink.value = null
  }
})
</script>

<template>
  <UiSettingsModal
    :model-value="modelValue"
    :title="$t('settings.title')"
    :sections="sections"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #default="{ activeSection }">
      <!-- Account section -->
      <div v-if="activeSection === 'account'" class="account-section">
        <div v-if="systemStatus && !systemStatus.auth.configured" class="auth-warning">
          <Icon name="lucide:shield-alert" class="auth-warning-icon" />
          <div class="auth-warning-content">
            <span class="auth-warning-title">{{ $t('system.authNotConfigured') }}</span>
            <span class="auth-warning-detail">{{ $t('system.authNotConfiguredDetail') }}</span>
          </div>
        </div>

        <div v-if="user" class="setting-group">
          <h3 class="section-title">{{ user.displayName }}</h3>
          <span class="account-username">@{{ user.username }}</span>
        </div>

        <div class="setting-group">
          <h3 class="section-title">{{ $t('auth.passkeys') }}</h3>
          <div v-if="credentials.length === 0" class="empty-message">
            {{ $t('auth.noPasskeys') }}
          </div>
          <div v-else class="credential-list">
            <div v-for="cred in credentials" :key="cred.id" class="credential-item">
              <div class="credential-info">
                <Icon name="lucide:fingerprint" class="credential-icon" />
                <div class="credential-details">
                  <span class="credential-type">{{ cred.deviceType === 'multiDevice' ? $t('auth.passkeyMultiDevice') : cred.deviceType === 'singleDevice' ? $t('auth.passkeySingleDevice') : 'Passkey' }}</span>
                  <span class="credential-date">{{ new Date(cred.createdAt).toLocaleDateString() }}</span>
                </div>
              </div>
              <UiButton
                variant="ghost"
                size="sm"
                icon="lucide:trash-2"
                :disabled="credentials.length <= 1"
                @click="handleDeleteCredential(cred.id)"
              />
            </div>
          </div>
          <UiButton
            variant="secondary"
            size="sm"
            icon="lucide:plus"
            :loading="registeringPasskey"
            @click="handleRegisterPasskey"
          >
            {{ $t('auth.registerNewPasskey') }}
          </UiButton>
        </div>

        <div class="setting-group">
          <h3 class="section-title">{{ $t('auth.inviteUser') }}</h3>

          <div v-if="inviteLink" class="invite-result">
            <code class="invite-url">{{ inviteLink }}</code>
            <UiButton variant="ghost" size="sm" icon="lucide:copy" @click="copyInviteLink" />
          </div>

          <div v-if="invites.length > 0" class="invite-list">
            <div v-for="inv in invites" :key="inv.token" class="invite-item">
              <div class="invite-info">
                <Icon name="lucide:link" class="invite-icon" />
                <div class="invite-details">
                  <code class="invite-token">...{{ inv.token.slice(-8) }}</code>
                  <span class="invite-expiry">{{ $t('auth.inviteExpires') }}: {{ new Date(inv.expiresAt).toLocaleDateString() }}</span>
                </div>
              </div>
              <UiButton variant="ghost" size="sm" icon="lucide:trash-2" @click="handleDeleteInvite(inv.token)" />
            </div>
          </div>

          <UiButton variant="secondary" size="sm" icon="lucide:user-plus" @click="handleCreateInvite">
            {{ $t('auth.inviteUser') }}
          </UiButton>
        </div>
      </div>

      <!-- Proxy section -->
      <ProxySettings v-if="activeSection === 'proxy'" />

      <!-- Backup section -->
      <BackupSettings v-if="activeSection === 'backup'" />

      <div v-if="activeSection === 'appearance'" class="appearance-section">
        <div class="setting-group">
          <h3 class="section-title">{{ $t('settings.mode') }}</h3>
          <div class="mode-options">
            <button
              v-for="m in modes"
              :key="m.value"
              class="mode-option"
              :class="{ active: config.mode === m.value }"
              @click="setMode(m.value)"
            >
              <Icon :name="m.icon" class="mode-icon" />
              <span class="mode-label">{{ m.label }}</span>
            </button>
          </div>
        </div>

        <div class="setting-group">
          <h3 class="section-title">{{ $t('settings.theme') }}</h3>
          <div class="palette-options">
            <button
              v-for="p in palettes"
              :key="p.id"
              class="palette-option"
              :class="{ active: config.palette === p.id }"
              @click="setPalette(p.id)"
            >
              <span class="palette-label">{{ p.label }}</span>
              <span class="palette-description">{{ p.description }}</span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="activeSection === 'language'" class="language-section">
        <h3 class="section-title">{{ $t('settings.language') }}</h3>
        <div class="language-options">
          <button
            v-for="loc in availableLocales"
            :key="loc.code"
            class="language-option"
            :class="{ active: locale === loc.code }"
            @click="setLocale(loc.code)"
          >
            <span class="language-label">{{ loc.name }}</span>
          </button>
        </div>
      </div>

      <div v-if="activeSection === 'about'" class="about-section">
        <h3 class="section-title">{{ $t('settings.about') }}</h3>
        <p class="about-text">
          {{ $t('app.description') }}
        </p>
      </div>
    </template>
  </UiSettingsModal>
</template>

<style scoped>
.appearance-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-bright);
  margin: 0;
}

.palette-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.palette-option {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background-color: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  transition: border-color var(--transition-fast), background-color var(--transition-fast);
  color: var(--color-text);

  &:hover {
    border-color: var(--color-text-muted);
    background-color: var(--color-surface-hover);
  }

  &.active {
    border-color: var(--color-accent);
  }
}

.palette-label {
  font-weight: 600;
  font-size: var(--font-size-md);
}

.palette-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.mode-options {
  display: flex;
  gap: var(--spacing-md);
}

.mode-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  background-color: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: border-color var(--transition-fast), background-color var(--transition-fast);
  color: var(--color-text-secondary);

  &:hover {
    border-color: var(--color-text-muted);
    background-color: var(--color-surface-hover);
  }

  &.active {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
}

.mode-icon {
  font-size: var(--font-size-2xl);
}

.mode-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.language-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.language-options {
  display: flex;
  gap: var(--spacing-md);
}

.language-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  background-color: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: border-color var(--transition-fast), background-color var(--transition-fast);
  color: var(--color-text-secondary);

  &:hover {
    border-color: var(--color-text-muted);
    background-color: var(--color-surface-hover);
  }

  &.active {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
}

.language-label {
  font-size: var(--font-size-md);
  font-weight: 600;
}

.about-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.about-text {
  color: var(--color-text-secondary);
  font-size: var(--font-size-md);
  line-height: 1.6;
  margin: 0;
}

.account-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.account-username {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.auth-warning {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: var(--color-warning-bg);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
}

.auth-warning-icon {
  color: var(--color-warning);
  font-size: var(--font-size-xl);
  flex-shrink: 0;
  margin-top: 2px;
}

.auth-warning-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.auth-warning-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
}

.auth-warning-detail {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.empty-message {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.credential-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.credential-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm);
  background-color: var(--color-bg);
  border-radius: var(--radius-md);
}

.credential-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.credential-icon {
  font-size: var(--font-size-xl);
  color: var(--color-accent);
}

.credential-details {
  display: flex;
  flex-direction: column;
}

.credential-type {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text);
}

.credential-date {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.invite-result {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.invite-url {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-accent);
  background-color: var(--color-bg);
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  word-break: break-all;
  flex: 1;
}

.invite-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.invite-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm);
  background-color: var(--color-bg);
  border-radius: var(--radius-md);
}

.invite-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.invite-icon {
  font-size: var(--font-size-lg);
  color: var(--color-text-muted);
}

.invite-details {
  display: flex;
  flex-direction: column;
}

.invite-token {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.invite-expiry {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
