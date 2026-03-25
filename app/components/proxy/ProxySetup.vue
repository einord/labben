<script setup lang="ts">
const {
  proxyProject,
  npmCandidates,
  loading,
  fetchProxySettings,
  fetchNpmCandidates,
  setProxyProject,
  createNpmProject,
  clearProxy,
} = useProxy()

const { detectUrl } = useNpm()

const showCreateForm = ref(false)
const newProjectName = ref('nginx-proxy-manager')
const creating = ref(false)
const npmAdminUrl = ref<string | null>(null)

/** Detect NPM admin panel URL from container ports */
async function loadAdminUrl() {
  npmAdminUrl.value = await detectUrl()
}

async function handleCreate() {
  if (!newProjectName.value.trim() || creating.value) return
  creating.value = true
  const success = await createNpmProject(newProjectName.value.trim())
  creating.value = false
  if (success) {
    showCreateForm.value = false
    newProjectName.value = 'nginx-proxy-manager'
    await refresh()
  }
}

async function handleSelect(name: string) {
  await setProxyProject(name)
  await refresh()
}

async function handleClear() {
  await clearProxy()
  await refresh()
}

async function refresh() {
  await Promise.all([fetchProxySettings(), fetchNpmCandidates()])
  await loadAdminUrl()
}

onMounted(() => refresh())
</script>

<template>
  <div class="proxy-setup">
    <!-- Current proxy -->
    <UiCard v-if="proxyProject">
      <template #header>Aktiv proxy</template>
      <div class="current-proxy">
        <div class="proxy-info">
          <UiBadge variant="success" dot>Aktiv</UiBadge>
          <span class="proxy-name">{{ proxyProject }}</span>
        </div>
        <div class="proxy-actions">
          <a
            v-if="npmAdminUrl"
            :href="npmAdminUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="admin-link"
          >
            <UiButton variant="secondary" size="sm" icon="lucide:external-link">
              Öppna admin
            </UiButton>
          </a>
          <UiButton variant="ghost" size="sm" icon="lucide:x" @click="handleClear">
            Ta bort
          </UiButton>
        </div>
      </div>
    </UiCard>

    <!-- No proxy set -->
    <UiCard v-else>
      <template #header>Proxy</template>
      <UiEmptyState
        icon="lucide:route"
        title="Ingen proxy konfigurerad"
        description="Valj ett befintligt Nginx Proxy Manager-projekt eller skapa ett nytt."
      />
    </UiCard>

    <!-- NPM Candidates -->
    <UiCard v-if="!proxyProject">
      <template #header>Tillgangliga proxy-projekt</template>
      <div v-if="loading" class="loading-wrapper">
        <UiSpinner size="md" />
      </div>
      <div v-else-if="npmCandidates.length === 0" class="empty-message">
        Inga projekt med Nginx Proxy Manager-image hittades.
      </div>
      <div v-else class="candidate-list">
        <div v-for="candidate in npmCandidates" :key="candidate.name" class="candidate-item">
          <div class="candidate-info">
            <span class="candidate-name">{{ candidate.name }}</span>
            <UiBadge
              :variant="candidate.runningCount > 0 ? 'success' : 'neutral'"
              dot
              size="sm"
            >
              {{ candidate.runningCount > 0 ? 'Igang' : 'Stoppad' }}
            </UiBadge>
          </div>
          <UiButton variant="primary" size="sm" @click="handleSelect(candidate.name)">
            Valj
          </UiButton>
        </div>
      </div>
    </UiCard>

    <!-- Create new NPM -->
    <UiCard v-if="!proxyProject">
      <template #header>Skapa ny proxy</template>
      <div v-if="!showCreateForm" class="create-prompt">
        <p class="create-description">
          Skapa ett nytt Nginx Proxy Manager-projekt med standardkonfiguration.
        </p>
        <UiButton variant="secondary" icon="lucide:plus" @click="showCreateForm = true">
          Skapa ny
        </UiButton>
      </div>
      <div v-else class="create-form">
        <UiInput
          v-model="newProjectName"
          label="Projektnamn"
          placeholder="nginx-proxy-manager"
        />
        <div class="form-actions">
          <UiButton variant="ghost" @click="showCreateForm = false">
            Avbryt
          </UiButton>
          <UiButton
            variant="primary"
            icon="lucide:plus"
            :loading="creating"
            :disabled="!newProjectName.trim()"
            @click="handleCreate"
          >
            Skapa
          </UiButton>
        </div>
      </div>
    </UiCard>
  </div>
</template>

<style scoped>
.proxy-setup {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.current-proxy {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.proxy-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.proxy-name {
  font-weight: 600;
  color: var(--color-text-bright);
  font-size: var(--font-size-lg);
}

.proxy-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.admin-link {
  text-decoration: none;
}

.loading-wrapper {
  display: flex;
  justify-content: center;
  padding: var(--spacing-lg);
}

.empty-message {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  padding: var(--spacing-md) 0;
}

.candidate-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.candidate-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
  }
}

.candidate-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.candidate-name {
  font-weight: 500;
  color: var(--color-text);
}

.create-prompt {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  align-items: flex-start;
}

.create-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.form-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}
</style>
