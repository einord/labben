<script setup lang="ts">
definePageMeta({ layout: false })

const { isSetup, isAuthenticated, register, login, fetchAuthState } = useAuth()
const { t } = useI18n()

const username = ref('')
const displayName = ref('')
const registering = ref(false)
const loggingIn = ref(false)

async function handleSetup() {
  if (!username.value.trim() || !displayName.value.trim()) return
  registering.value = true
  const success = await register(username.value.trim(), displayName.value.trim())
  registering.value = false
  if (success) {
    navigateTo('/')
  }
}

async function handleLogin() {
  loggingIn.value = true
  const success = await login()
  loggingIn.value = false
  if (success) {
    navigateTo('/')
  }
}

onMounted(async () => {
  await fetchAuthState()
  if (isAuthenticated.value) {
    navigateTo('/')
  }
})
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="logo">
        <Icon name="lucide:flask-round" class="logo-icon" />
        <h1 class="logo-text">Labben</h1>
      </div>

      <!-- First-time setup -->
      <template v-if="!isSetup">
        <p class="subtitle">{{ $t('auth.welcomeSetup') }}</p>
        <div class="form">
          <UiInput
            v-model="username"
            :label="$t('auth.username')"
            :placeholder="$t('auth.usernamePlaceholder')"
          />
          <UiInput
            v-model="displayName"
            :label="$t('auth.displayName')"
            :placeholder="$t('auth.displayNamePlaceholder')"
          />
          <UiButton
            variant="primary"
            icon="lucide:fingerprint"
            :loading="registering"
            :disabled="!username.trim() || !displayName.trim()"
            @click="handleSetup"
          >
            {{ $t('auth.createAccount') }}
          </UiButton>
        </div>
      </template>

      <!-- Login -->
      <template v-else>
        <p class="subtitle">{{ $t('auth.loginSubtitle') }}</p>
        <UiButton
          variant="primary"
          icon="lucide:fingerprint"
          :loading="loggingIn"
          @click="handleLogin"
        >
          {{ $t('auth.loginWithPasskey') }}
        </UiButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg);
  padding: var(--spacing-xl);
}

.login-card {
  width: 100%;
  max-width: 400px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.logo-icon {
  font-size: var(--font-size-3xl);
  color: var(--color-accent);
}

.logo-text {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-accent);
  margin: 0;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: var(--font-size-md);
  text-align: center;
  margin: 0;
}

.form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
</style>
