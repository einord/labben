<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const { register } = useAuth()
const { t } = useI18n()

const token = route.params.token as string
const valid = ref<boolean | null>(null)
const username = ref('')
const displayName = ref('')
const registering = ref(false)

async function validateToken() {
  try {
    await $fetch(`/api/auth/invite/${token}`)
    valid.value = true
  } catch {
    valid.value = false
  }
}

async function handleRegister() {
  if (!username.value.trim() || !displayName.value.trim()) return
  registering.value = true
  const success = await register(username.value.trim(), displayName.value.trim(), token)
  registering.value = false
  if (success) {
    navigateTo('/')
  }
}

onMounted(() => validateToken())
</script>

<template>
  <div class="invite-page">
    <div class="invite-card">
      <div class="logo">
        <Icon name="lucide:flask-round" class="logo-icon" />
        <h1 class="logo-text">Labben</h1>
      </div>

      <template v-if="valid === null">
        <UiSpinner size="lg" />
      </template>

      <template v-else-if="valid">
        <p class="subtitle">{{ $t('auth.inviteWelcome') }}</p>
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
            @click="handleRegister"
          >
            {{ $t('auth.createAccount') }}
          </UiButton>
        </div>
      </template>

      <template v-else>
        <UiEmptyState
          icon="lucide:link-2-off"
          :title="$t('auth.inviteInvalid')"
          :description="$t('auth.inviteInvalidDescription')"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.invite-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg);
  padding: var(--spacing-xl);
}

.invite-card {
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
