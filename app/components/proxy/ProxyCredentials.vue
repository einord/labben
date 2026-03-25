<script setup lang="ts">
const {
  status,
  fetchStatus,
  testConnection,
  saveCredentials,
  clearCredentials,
  changePassword,
  detectUrl,
} = useNpm()

const formUrl = ref('')
const formEmail = ref('')
const formPassword = ref('')
const testing = ref(false)
const testResult = ref<boolean | null>(null)
const saving = ref(false)
const showForm = ref(false)

// Password change
const newPassword = ref('')
const confirmPassword = ref('')
const changingPassword = ref(false)

const passwordsMatch = computed(() => newPassword.value === confirmPassword.value)
const passwordValid = computed(() => newPassword.value.length >= 8 && passwordsMatch.value)

/** Fill in default NPM credentials */
function useDefaults() {
  formEmail.value = 'admin@example.com'
  formPassword.value = 'changeme'
}

/** Auto-detect the NPM URL */
async function autoDetect() {
  const url = await detectUrl()
  if (url) {
    formUrl.value = url
  }
}

/** Test connection with form values */
async function handleTest() {
  if (!formUrl.value || !formEmail.value || !formPassword.value) return
  testing.value = true
  testResult.value = null
  testResult.value = await testConnection(formUrl.value, formEmail.value, formPassword.value)
  testing.value = false
}

/** Save credentials */
async function handleSave() {
  if (!formUrl.value || !formEmail.value || !formPassword.value) return
  saving.value = true
  const success = await saveCredentials(formUrl.value, formEmail.value, formPassword.value)
  saving.value = false
  if (success) {
    showForm.value = false
    testResult.value = null
  }
}

/** Handle password change */
async function handleChangePassword() {
  if (!passwordValid.value) return
  changingPassword.value = true
  const success = await changePassword(status.value.isDefault ? 'changeme' : formPassword.value, newPassword.value)
  changingPassword.value = false
  if (success) {
    newPassword.value = ''
    confirmPassword.value = ''
  }
}

/** Show edit form with current values */
function editCredentials() {
  formUrl.value = status.value.url ?? ''
  formEmail.value = status.value.email ?? ''
  formPassword.value = ''
  testResult.value = null
  showForm.value = true
}

/** Reset and enter setup mode */
function startSetup() {
  formUrl.value = ''
  formEmail.value = ''
  formPassword.value = ''
  testResult.value = null
  showForm.value = true
  autoDetect()
}

onMounted(async () => {
  await fetchStatus()
  if (!status.value.connected && !status.value.url) {
    startSetup()
  }
})
</script>

<template>
  <div class="proxy-credentials">
    <!-- Connected state -->
    <UiCard v-if="status.connected && !showForm">
      <template #header>API-anslutning</template>
      <div class="connected-status">
        <div class="status-row">
          <UiBadge variant="success" dot>Ansluten</UiBadge>
          <span class="status-detail">{{ status.url }}</span>
        </div>
        <div class="status-row">
          <span class="status-label">Konto</span>
          <span class="status-detail">{{ status.email }}</span>
        </div>
        <div class="status-actions">
          <UiButton variant="ghost" size="sm" @click="editCredentials">
            Ändra
          </UiButton>
          <UiButton variant="ghost" size="sm" icon="lucide:trash-2" @click="clearCredentials">
            Ta bort
          </UiButton>
        </div>
      </div>

      <!-- Default password warning -->
      <div v-if="status.isDefault" class="default-warning">
        <div class="warning-header">
          <Icon name="lucide:alert-triangle" class="warning-icon" />
          <span>Du använder standardlösenordet — byt det för säkerhetens skull.</span>
        </div>
        <div class="password-form">
          <UiInput
            v-model="newPassword"
            label="Nytt lösenord"
            type="password"
            placeholder="Minst 8 tecken"
          />
          <UiInput
            v-model="confirmPassword"
            label="Bekräfta lösenord"
            type="password"
            :error="confirmPassword && !passwordsMatch ? 'Lösenorden matchar inte' : ''"
          />
          <UiButton
            variant="primary"
            size="sm"
            :disabled="!passwordValid"
            :loading="changingPassword"
            @click="handleChangePassword"
          >
            Byt lösenord
          </UiButton>
        </div>
      </div>
    </UiCard>

    <!-- Setup / Edit form -->
    <UiCard v-if="showForm || (!status.connected && !status.url)">
      <template #header>Anslut till Nginx Proxy Manager</template>
      <div class="setup-form">
        <div class="url-row">
          <UiInput
            v-model="formUrl"
            label="API URL"
            placeholder="http://localhost:81"
          />
          <UiButton variant="ghost" size="sm" icon="lucide:search" @click="autoDetect">
            Detektera
          </UiButton>
        </div>
        <UiInput
          v-model="formEmail"
          label="E-post"
          placeholder="admin@example.com"
        />
        <UiInput
          v-model="formPassword"
          label="Lösenord"
          type="password"
          placeholder="Lösenord"
        />

        <div class="form-actions">
          <UiButton variant="ghost" size="sm" @click="useDefaults">
            Fyll i standarduppgifter
          </UiButton>
          <div class="form-actions-right">
            <UiButton
              variant="secondary"
              size="sm"
              :loading="testing"
              :disabled="!formUrl || !formEmail || !formPassword"
              @click="handleTest"
            >
              Testa
            </UiButton>
            <UiButton
              variant="primary"
              size="sm"
              :loading="saving"
              :disabled="!formUrl || !formEmail || !formPassword"
              @click="handleSave"
            >
              Spara
            </UiButton>
          </div>
        </div>

        <div v-if="testResult !== null" class="test-result">
          <UiBadge :variant="testResult ? 'success' : 'danger'" dot>
            {{ testResult ? 'Anslutning lyckades' : 'Anslutning misslyckades' }}
          </UiBadge>
        </div>

        <UiButton v-if="showForm && status.url" variant="ghost" size="sm" @click="showForm = false">
          Avbryt
        </UiButton>
      </div>
    </UiCard>
  </div>
</template>

<style scoped>
.proxy-credentials {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.connected-status {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.status-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.status-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.status-detail {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
}

.status-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.default-warning {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-warning-bg);
  border-radius: var(--radius-md);
}

.warning-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-warning);
  font-size: var(--font-size-sm);
  font-weight: 600;
  margin-bottom: var(--spacing-md);
}

.warning-icon {
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.url-row {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-sm);

  > :first-child {
    flex: 1;
  }
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-actions-right {
  display: flex;
  gap: var(--spacing-sm);
}

.test-result {
  padding: var(--spacing-sm) 0;
}
</style>
